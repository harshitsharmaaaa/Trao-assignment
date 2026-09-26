import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";

export interface LLMOptions {
  temperature?: number;
  maxTokens?: number;
}

export interface KeySlot {
  slot: number;
  key: string;
  legacy?: boolean;
}

// Resolve configured Gemini key slots in deterministic order 1 -> 2 -> 3 -> 4.
// - If any GEMINI_API_KEY_1..4 is set (trimmed, non-empty), use those in slot order.
// - Otherwise fall back to legacy single GEMINI_API_KEY (backward compat).
// - Otherwise return [] (caller raises explicit missing-key error).
export function resolveKeySlots(): KeySlot[] {
  const numbered: KeySlot[] = [];
  for (let i = 1; i <= 4; i++) {
    const v = (process.env[`GEMINI_API_KEY_${i}`] || "").trim();
    if (v) numbered.push({ slot: i, key: v });
  }
  if (numbered.length > 0) return numbered;
  const legacy = (process.env.GEMINI_API_KEY || "").trim();
  if (legacy) return [{ slot: 1, key: legacy, legacy: true }];
  return [];
}

export function getConfiguredKeySlots(): number {
  return resolveKeySlots().length;
}

// ---------------------------------------------------------------------------
// Daily-quota exhaustion classification.
// Rotate ONLY on clear daily project-quota signals. Never on 503, per-minute
// 429s, network blips, malformed JSON, or schema validation failures.
// Daily signals: GenerateRequestsPerDay*, PerDayPerProject*, daily+quota.
// Per-minute 429s contain PerMinute/Minute and must NOT rotate.
// ---------------------------------------------------------------------------
export function isDailyQuotaExhausted(err: any): boolean {
  try {
    const parts: string[] = [];
    if (err?.message) parts.push(String(err.message));
    if (err?.code) parts.push(String(err.code));
    if (err?.status) parts.push(String(err.status));
    if (err?.statusText) parts.push(String(err.statusText));
    // errorDetails from @google/generative-ai may carry quotaId entries.
    try {
      const details = (err as any)?.errorDetails;
      if (details) parts.push(JSON.stringify(details).slice(0, 2000));
    } catch {
      // ignore stringify issues
    }
    const text = parts.join(" | ").toLowerCase();
    if (!text) return false;
    if (text.includes("generaterequestsperday") || text.includes("perdayperproject")) return true;
    if (text.includes("daily") && (text.includes("quota") || text.includes("exhaust") || text.includes("exceed") || text.includes("freertier") || text.includes("free-tier"))) {
      // Guard: a message mentioning both daily and per-minute is still daily.
      return true;
    }
    if (text.includes("quota exceeded") && text.includes("per day")) return true;
    return false;
  } catch {
    return false;
  }
}

function sanitizeErrorMessage(msg: string, slots: KeySlot[]): string {
  let out = msg;
  try {
    for (const s of slots) {
      if (s.key && s.key.length >= 8 && out.includes(s.key)) {
        out = out.split(s.key).join("[REDACTED_KEY]");
      }
    }
  } catch {
    // never fail sanitization
  }
  return out;
}


async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Provider-level rate limiting (process-wide).
// Every real HTTP attempt — including retries — consumes provider quota, so
// every attempt must pass through acquireRateSlot() before touching the API.
// Mock generation makes zero HTTP requests and bypasses the limiter.
// The limit is configured via LLM_REQUESTS_PER_MINUTE (default 5, matching
// the observed Gemini free-tier per-minute quota). The limiter is shared
// process-wide across all configured GEMINI_API_KEY_1..4 slots (conservative:
// per-project limits are at least this strict).
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
  configuredKeySlots: number;
  keysUsed: number;
  keyRotations: number;
  exhaustedKeys: number;
}

const llmStats: LlmStats = {
  successfulCalls: 0,
  failedCalls: 0,
  totalHttpRequests: 0,
  failedAttempts: 0,
  retryCount: 0,
  totalRuntimeMs: 0,
  configuredKeySlots: 0,
  keysUsed: 0,
  keyRotations: 0,
  exhaustedKeys: 0,
};

// Process-wide rotation state (never holds key values in logs; slots only).
const exhaustedSlots = new Set<number>();
const usedSlots = new Set<number>();

export function resetKeyRotationState(): void {
  exhaustedSlots.clear();
  usedSlots.clear();
}

export function getExhaustedSlots(): number[] {
  return [...exhaustedSlots].sort((a, b) => a - b);
}

export function getUsedSlots(): number[] {
  return [...usedSlots].sort((a, b) => a - b);
}

export function getLlmStats(): LlmStats {
  return {
    ...llmStats,
    configuredKeySlots: getConfiguredKeySlots(),
    keysUsed: usedSlots.size,
    exhaustedKeys: exhaustedSlots.size,
  };
}

export function resetLlmStats(): void {
  llmStats.successfulCalls = 0;
  llmStats.failedCalls = 0;
  llmStats.totalHttpRequests = 0;
  llmStats.failedAttempts = 0;
  llmStats.retryCount = 0;
  llmStats.totalRuntimeMs = 0;
  llmStats.configuredKeySlots = 0;
  llmStats.keysUsed = 0;
  llmStats.keyRotations = 0;
  llmStats.exhaustedKeys = 0;
  exhaustedSlots.clear();
  usedSlots.clear();
}

// Test seam: override the per-slot text generation (no real HTTP in tests).
// Production default is null (uses real GoogleGenerativeAI SDK).
type GenerateTextFn = (slot: KeySlot, prompt: string) => Promise<string>;
let generateTextOverride: GenerateTextFn | null = null;

export function __setGenerateTextOverride(fn: GenerateTextFn | null): void {
  generateTextOverride = fn;
}

export function __resetGenerateTextOverride(): void {
  generateTextOverride = null;
}

async function generateTextWithSlot(
  slot: KeySlot,
  prompt: string,
  modelName: string,
  temperature: number | undefined,
  systemInstruction: string
): Promise<string> {
  if (generateTextOverride) {
    return generateTextOverride(slot, prompt);
  }
  const genAI = new GoogleGenerativeAI(slot.key);
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: temperature ?? 0.2,
      responseMimeType: "application/json",
    },
    systemInstruction,
  });
  const result = await model.generateContent(prompt);
  return result.response.text();
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
  const modelName = process.env.LLM_MODEL || "gemini-3.6-flash";

  if (isMock) {
    console.log("[LLM Client] MOCK_LLM is enabled. Using mock generation.");
    return getFallbackJsonForSchema(schema, prompt);
  }

  const slots = resolveKeySlots();
  llmStats.configuredKeySlots = slots.length;

  if (slots.length === 0) {
    throw new Error(
      "[LLM Client Error] No Gemini API key configured while MOCK_LLM=false. Please set GEMINI_API_KEY_1..GEMINI_API_KEY_4 (or legacy GEMINI_API_KEY) or set MOCK_LLM=true for mock mode."
    );
  }

  const available = slots.filter((s) => !exhaustedSlots.has(s.slot));
  if (available.length === 0) {
    throw new Error(
      `[LLM Fatal Error] All ${slots.length} Gemini key slot(s) daily-exhausted. No available quota.`
    );
  }

  console.log(
    `[LLM Client] Executing REAL Gemini call using model=${modelName} (provider=${provider}) slots=${slots.length} startingSlot=${available[0].slot}`
  );

  const callStartedAt = Date.now();
  let lastError: any = null;

  for (let slotPos = 0; slotPos < available.length; slotPos++) {
    const slot = available[slotPos];
    usedSlots.add(slot.slot);
    llmStats.keysUsed = usedSlots.size;

    let delay = 1000;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      // Every attempt is a real provider request (retries included): pace it.
      await acquireRateSlot();
      llmStats.totalHttpRequests += 1;
      if (attempt > 1) llmStats.retryCount += 1;

      try {
        const text = await generateTextWithSlot(
          slot,
          prompt,
          modelName,
          options.temperature,
          systemInstruction
        );
        const cleanedJson = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const parsedRaw = JSON.parse(cleanedJson);

        const validated = schema.parse(parsedRaw);
        llmStats.successfulCalls += 1;
        llmStats.totalRuntimeMs += Date.now() - callStartedAt;
        return validated;
      } catch (err: any) {
        lastError = err;
        llmStats.failedAttempts += 1;
        const safeMsg = sanitizeErrorMessage(String(err?.message || err), slots);

        if (isDailyQuotaExhausted(err)) {
          exhaustedSlots.add(slot.slot);
          llmStats.exhaustedKeys = exhaustedSlots.size;
          const hasNext = slotPos + 1 < available.length;
          if (hasNext) {
            llmStats.keyRotations += 1;
            console.warn(
              `[LLM Quota] Slot ${slot.slot} daily-exhausted, rotating to slot ${available[slotPos + 1].slot}. (${safeMsg.slice(0, 200)})`
            );
            llmStats.retryCount += 1;
          } else {
            console.warn(`[LLM Quota] Slot ${slot.slot} daily-exhausted, no slots remain. (${safeMsg.slice(0, 200)})`);
          }
          break;
        }

        console.warn(`[LLM Retry ${attempt}/${maxRetries} slot=${slot.slot}] Failed: ${safeMsg.slice(0, 300)}`);

        if (attempt < maxRetries) {
          await sleep(delay);
          delay *= 2;
        }
      }
    }
    // Failover rule: next slot is tried ONLY when this slot was marked
    // daily-exhausted. Non-quota failures (503, RPM 429, network, JSON,
    // schema) never rotate — fail fast after this slot's retries.
    if (!exhaustedSlots.has(slot.slot)) {
      break;
    }
  }

  llmStats.failedCalls += 1;
  llmStats.totalRuntimeMs += Date.now() - callStartedAt;
  const safeLast = sanitizeErrorMessage(String(lastError?.message || lastError), slots);
  throw new Error(`[LLM Fatal Error] Gemini API call (${modelName}) failed after exhausting available slots/retries: ${safeLast.slice(0, 500)}`);
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
