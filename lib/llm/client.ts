import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";

export interface LLMOptions {
  temperature?: number;
  maxTokens?: number;
}

const LLM_PROVIDER = process.env.LLM_PROVIDER || "gemini"; // "gemini" | "mock"
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL_NAME = process.env.LLM_MODEL || "gemini-3.6-flash";


async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Provider-level rate limiting (process-wide).
// Every real HTTP attempt — including retries — consumes provider quota, so
// every attempt must pass through acquireRateSlot() before touching the API.
// Mock generation makes zero HTTP requests and bypasses the limiter.
// The limit is configured via LLM_REQUESTS_PER_MINUTE (default 5, matching
// the observed Gemini free-tier per-minute quota). No key rotation: the
// limiter only paces requests made with the single configured GEMINI_API_KEY.
// NOTE: the window is per-process; separate processes/hosts have separate
// windows, so keep parallel producers within the same budget.
// ---------------------------------------------------------------------------
const RATE_WINDOW_MS = 60_000;

export function resolveRequestsPerMinute(): number {
  const raw = Number(process.env.LLM_REQUESTS_PER_MINUTE);
  if (Number.isFinite(raw) && raw > 0) return Math.floor(raw);
  return 5;
}

const attemptTimestamps: number[] = [];
let admissionQueue: Promise<void> = Promise.resolve();

export async function acquireRateSlot(): Promise<void> {
  let release = () => {};
  const previous = admissionQueue;
  admissionQueue = new Promise<void>((resolve) => {
    release = resolve;
  });
  await previous;
  try {
    const limit = resolveRequestsPerMinute();
    for (;;) {
      const now = Date.now();
      while (attemptTimestamps.length > 0 && attemptTimestamps[0] <= now - RATE_WINDOW_MS) {
        attemptTimestamps.shift();
      }
      if (attemptTimestamps.length < limit) {
        attemptTimestamps.push(now);
        return;
      }
      const waitMs = attemptTimestamps[0] + RATE_WINDOW_MS - now + 50;
      console.log(
        `[LLM Rate Limiter] ${attemptTimestamps.length} provider requests in the last minute (limit=${limit}/min). Throttling ${(waitMs / 1000).toFixed(1)}s.`
      );
      await sleep(waitMs);
    }
  } finally {
    release();
  }
}

export function resetRateLimiter(): void {
  attemptTimestamps.length = 0;
}

// ---------------------------------------------------------------------------
// Safe usage statistics (real provider calls only — mock calls return before
// any counter is touched). Exposes counts only: no keys, no prompts, no
// response content. Read via getLlmStats() for verification reporting.
// ---------------------------------------------------------------------------
export interface LlmStats {
  successfulCalls: number;
  failedCalls: number;
  totalHttpRequests: number;
  failedAttempts: number;
  retryCount: number;
  totalRuntimeMs: number;
}

const llmStats: LlmStats = {
  successfulCalls: 0,
  failedCalls: 0,
  totalHttpRequests: 0,
  failedAttempts: 0,
  retryCount: 0,
  totalRuntimeMs: 0,
};

export function getLlmStats(): LlmStats {
  return { ...llmStats };
}

export function resetLlmStats(): void {
  llmStats.successfulCalls = 0;
  llmStats.failedCalls = 0;
  llmStats.totalHttpRequests = 0;
  llmStats.failedAttempts = 0;
  llmStats.retryCount = 0;
  llmStats.totalRuntimeMs = 0;
}

export async function generateStructuredJson<T>(
  prompt: string,
  systemInstruction: string,
  schema: z.ZodType<T>,
  options: LLMOptions = {},
  maxRetries: number = 3
): Promise<T> {
  const provider = process.env.LLM_PROVIDER || "gemini";
  const isMock = process.env.MOCK_LLM === "true" || provider === "mock";
  const apiKey = process.env.GEMINI_API_KEY || "";
  const modelName = process.env.LLM_MODEL || "gemini-3.6-flash";

  if (isMock) {
    console.log("[LLM Client] MOCK_LLM is enabled. Using mock generation.");
    return getFallbackJsonForSchema(schema, prompt);
  }

  if (!apiKey) {
    throw new Error(
      "[LLM Client Error] GEMINI_API_KEY environment variable is missing while MOCK_LLM=false. Please set GEMINI_API_KEY or set MOCK_LLM=true for mock mode."
    );
  }

  console.log(`[LLM Client] Executing REAL Gemini call using model=${modelName} (provider=${provider})`);

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: options.temperature ?? 0.2,
      responseMimeType: "application/json",
    },
    systemInstruction,
  });

  const callStartedAt = Date.now();
  let lastError: any = null;
  let delay = 1000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    // Every attempt is a real provider request (retries included): pace it.
    await acquireRateSlot();
    llmStats.totalHttpRequests += 1;
    if (attempt > 1) llmStats.retryCount += 1;

    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const cleanedJson = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsedRaw = JSON.parse(cleanedJson);

      const validated = schema.parse(parsedRaw);
      llmStats.successfulCalls += 1;
      llmStats.totalRuntimeMs += Date.now() - callStartedAt;
      return validated;
    } catch (err: any) {
      lastError = err;
      llmStats.failedAttempts += 1;
      console.warn(`[LLM Retry ${attempt}/${maxRetries}] Failed: ${err.message}`);

      if (attempt < maxRetries) {
        await sleep(delay);
        delay *= 2;
      }
    }
  }

  llmStats.failedCalls += 1;
  llmStats.totalRuntimeMs += Date.now() - callStartedAt;
  throw new Error(`[LLM Fatal Error] Gemini API call (${modelName}) failed after ${maxRetries} retries: ${lastError?.message}`);
}


function getFallbackJsonForSchema<T>(schema: z.ZodType<T>, prompt: string): T {
  const pLower = prompt.toLowerCase();

  if (pLower.includes("extract atomic requirements") || pLower.includes("extractrequirements")) {
    return [
      { id: "r1", text: "React experience", kind: "technical", priority: "must" },
      { id: "r2", text: "System Architecture", kind: "technical", priority: "must" },
      { id: "r3", text: "GraphQL knowledge", kind: "technical", priority: "nice" },
    ] as unknown as T;
  }
  if (pLower.includes("analyze the company and role") || pLower.includes("brief")) {
    return {
      company_name: "Acme Corp",
      role_title: "Senior Frontend Engineer",
      seniority: "Senior",
      location: "Remote",
      summary: "Acme Corp is an industry-leading software company.",
      what_they_do: "Develops digital web applications and platforms.",
      responsibilities: ["Develop UI components", "Optimize web performance"],
    } as unknown as T;
  }
  if (pLower.includes("regenerate company brief")) {
    return {
      summary: "Regenerated concise company summary.",
      what_they_do: "Regenerated description of what the company does.",
      sources: [],
    } as unknown as T;
  }
  if (pLower.includes("regenerate questions specifically for category")) {
    const m = pLower.match(/category '([a-z-]+)'/);
    const cat = (m && m[1]) || "technical";
    return [
      {
        requirement_id: "r1",
        category: cat,
        prompt: `Regenerated ${cat} interview question for review.`,
        answer_outline: "Regenerated structured answer outline.",
        difficulty: 2,
      },
    ] as unknown as T;
  }
  if (pLower.includes("generate missing targeted questions")) {
    return [
      {
        requirement_id: "r2",
        category: "system-design",
        prompt: "How do you optimize frontend bundle size and web performance?",
        answer_outline: "Code splitting, lazy loading, image optimization.",
        difficulty: 3,
      },
    ] as unknown as T;
  }
  if (pLower.includes("generate comprehensive interview questions") || pLower.includes("questions")) {
    return {
      questions: [
        {
          requirement_id: "r1",
          category: "technical",
          prompt: "Explain React Reconciliation and the Virtual DOM.",
          answer_outline: "Fiber tree diffing, state batching.",
          difficulty: 2,
        },
        {
          requirement_id: "r2",
          category: "system-design",
          prompt: "How do you design a scalable micro-frontend architecture?",
          answer_outline: "Module federation, asset isolation.",
          difficulty: 3,
        },
      ],
      flashcards: [
        {
          front: "What is React Reconciliation?",
          back: "The algorithm React uses to diff one tree of elements with another.",
          requirement_id: "r1",
        },
      ],
    } as unknown as T;
  }

  // Attempt default Zod schema parsing or return basic fallback object
  try {
    return schema.parse({}) as T;
  } catch {
    throw new Error(`Unable to generate structured fallback output for prompt: ${prompt.slice(0, 100)}`);
  }
}
