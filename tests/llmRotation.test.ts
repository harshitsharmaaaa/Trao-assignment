import { expect, test, describe, beforeEach, afterEach } from "bun:test";
import { z } from "zod";
import {
  resolveKeySlots,
  isDailyQuotaExhausted,
  generateStructuredJson,
  getLlmStats,
  resetLlmStats,
  resetKeyRotationState,
  resetRateLimiter,
  __setGenerateTextOverride,
  __resetGenerateTextOverride,
} from "@/lib/llm/client";

const schema = z.object({ hello: z.string() });
const OK_JSON = JSON.stringify({ hello: "world" });

function dailyQuotaError(): Error {
  const e: any = new Error(
    "429 Too Many Requests: GenerateRequestsPerDayPerProjectPerModel-FreeTier quota 20 exhausted for model"
  );
  e.status = 429;
  return e;
}

function rpmError(): Error {
  const e: any = new Error(
    "429 Too Many Requests: GenerateRequestsPerMinutePerProjectPerModel quota exceeded, retry in 20s"
  );
  e.status = 429;
  return e;
}

function transient503(): Error {
  const e: any = new Error("503 Service Unavailable: model overloaded, please retry");
  e.status = 503;
  return e;
}

const SAVED: Record<string, string | undefined> = {};

function setEnv(vars: Record<string, string | undefined>): void {
  for (const [k, v] of Object.entries(vars)) {
    if (!(k in SAVED)) SAVED[k] = process.env[k];
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
}

function clearGeminiKeys(): void {
  setEnv({
    GEMINI_API_KEY: undefined,
    GEMINI_API_KEY_1: undefined,
    GEMINI_API_KEY_2: undefined,
    GEMINI_API_KEY_3: undefined,
    GEMINI_API_KEY_4: undefined,
  });
}

describe("LLM 4-slot key pool + deterministic rotation", () => {
  beforeEach(() => {
    resetLlmStats();
    resetKeyRotationState();
    resetRateLimiter();
    __resetGenerateTextOverride();
    setEnv({
      LLM_PROVIDER: "gemini",
      MOCK_LLM: "false",
      LLM_MODEL: "gemini-3.5-flash-lite",
      LLM_REQUESTS_PER_MINUTE: "1000",
    });
    clearGeminiKeys();
  });

  afterEach(() => {
    __resetGenerateTextOverride();
    resetLlmStats();
    resetKeyRotationState();
    resetRateLimiter();
    for (const [k, v] of Object.entries(SAVED)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
    for (const k of Object.keys(SAVED)) delete SAVED[k];
  });

  test("legacy single GEMINI_API_KEY resolves as one slot (backward compat)", () => {
    setEnv({ GEMINI_API_KEY: "legacy-test-key-aaa" });
    const slots = resolveKeySlots();
    expect(slots.length).toBe(1);
    expect(slots[0].slot).toBe(1);
    expect(slots[0].legacy).toBe(true);
  });

  test("four numbered keys resolve in slot order and prefer numbered over legacy", () => {
    setEnv({
      GEMINI_API_KEY: "legacy-test-key-aaa",
      GEMINI_API_KEY_1: "num-key-1",
      GEMINI_API_KEY_2: "num-key-2",
      GEMINI_API_KEY_3: "num-key-3",
      GEMINI_API_KEY_4: "num-key-4",
    });
    const slots = resolveKeySlots();
    expect(slots.map((s) => s.slot)).toEqual([1, 2, 3, 4]);
    expect(slots.every((s) => !s.legacy)).toBe(true);
  });

  test("missing keys with MOCK_LLM=false raises explicit error", async () => {
    clearGeminiKeys();
    let msg = "";
    try {
      await generateStructuredJson("p", "s", schema, {}, 1);
    } catch (e: any) {
      msg = e.message;
    }
    expect(msg).toMatch(/No Gemini API key configured/);
  });

  test("MOCK_LLM=true makes zero HTTP requests and never touches override", async () => {
    setEnv({ MOCK_LLM: "true", GEMINI_API_KEY_1: "num-key-1" });
    let called = 0;
    __setGenerateTextOverride(async () => {
      called += 1;
      return OK_JSON;
    });
    const statsBefore = getLlmStats();
    expect(statsBefore.totalHttpRequests).toBe(0);
    // Mock path uses fallback schema parsing; use a mock-friendly prompt path.
    // Any prompt that does not match fallback heuristics throws from fallback,
    // so assert instead that no HTTP was recorded and override untouched.
    try {
      await generateStructuredJson("unmatched mock prompt xyz", "s", schema, {}, 1);
    } catch {
      // fallback may throw for unknown schema — acceptable; key assertion below
    }
    expect(called).toBe(0);
    expect(getLlmStats().totalHttpRequests).toBe(0);
  });

  test("success on Slot 1 records keysUsed=1 and configured slots", async () => {
    setEnv({
      GEMINI_API_KEY_1: "num-key-1",
      GEMINI_API_KEY_2: "num-key-2",
      GEMINI_API_KEY_3: "num-key-3",
      GEMINI_API_KEY_4: "num-key-4",
    });
    const seen: number[] = [];
    __setGenerateTextOverride(async (slot) => {
      seen.push(slot.slot);
      return OK_JSON;
    });
    const out = await generateStructuredJson("p", "s", schema, {}, 2);
    expect(out).toEqual({ hello: "world" });
    expect(seen).toEqual([1]);
    const stats = getLlmStats();
    expect(stats.configuredKeySlots).toBe(4);
    expect(stats.keysUsed).toBe(1);
    expect(stats.keyRotations).toBe(0);
    expect(stats.exhaustedKeys).toBe(0);
    expect(stats.successfulCalls).toBe(1);
  });

  test("daily exhaustion on Slot 1 rotates to Slot 2", async () => {
    setEnv({ GEMINI_API_KEY_1: "num-key-1", GEMINI_API_KEY_2: "num-key-2" });
    const seen: number[] = [];
    __setGenerateTextOverride(async (slot) => {
      seen.push(slot.slot);
      if (slot.slot === 1) throw dailyQuotaError();
      return OK_JSON;
    });
    const out = await generateStructuredJson("p", "s", schema, {}, 2);
    expect(out).toEqual({ hello: "world" });
    expect(seen[0]).toBe(1);
    expect(seen[seen.length - 1]).toBe(2);
    const stats = getLlmStats();
    expect(stats.keyRotations).toBe(1);
    expect(stats.exhaustedKeys).toBe(1);
    expect(stats.keysUsed).toBe(2);
  });

  test("daily exhaustion cascades Slot 2 -> Slot 3", async () => {
    setEnv({
      GEMINI_API_KEY_1: "num-key-1",
      GEMINI_API_KEY_2: "num-key-2",
      GEMINI_API_KEY_3: "num-key-3",
    });
    // Pre-exhaust slot 1 via first call, then verify second call starts at 2 and rotates to 3.
    __setGenerateTextOverride(async (slot) => {
      if (slot.slot <= 2) throw dailyQuotaError();
      return OK_JSON;
    });
    const out = await generateStructuredJson("p", "s", schema, {}, 1);
    expect(out).toEqual({ hello: "world" });
    const stats = getLlmStats();
    expect(stats.keyRotations).toBe(2);
    expect(stats.exhaustedKeys).toBe(2);
    expect(stats.keysUsed).toBe(3);
  });

  test("daily exhaustion cascades to Slot 4", async () => {
    setEnv({
      GEMINI_API_KEY_1: "num-key-1",
      GEMINI_API_KEY_2: "num-key-2",
      GEMINI_API_KEY_3: "num-key-3",
      GEMINI_API_KEY_4: "num-key-4",
    });
    __setGenerateTextOverride(async (slot) => {
      if (slot.slot < 4) throw dailyQuotaError();
      return OK_JSON;
    });
    const out = await generateStructuredJson("p", "s", schema, {}, 1);
    expect(out).toEqual({ hello: "world" });
    const stats = getLlmStats();
    expect(stats.keyRotations).toBe(3);
    expect(stats.exhaustedKeys).toBe(3);
    expect(stats.keysUsed).toBe(4);
  });

  test("all slots daily-exhausted returns structured failure", async () => {
    setEnv({ GEMINI_API_KEY_1: "num-key-1", GEMINI_API_KEY_2: "num-key-2" });
    __setGenerateTextOverride(async () => {
      throw dailyQuotaError();
    });
    let msg = "";
    try {
      await generateStructuredJson("p", "s", schema, {}, 1);
    } catch (e: any) {
      msg = e.message;
    }
    expect(msg).toMatch(/LLM Fatal Error/);
    const stats = getLlmStats();
    expect(stats.exhaustedKeys).toBe(2);
    expect(stats.failedCalls).toBe(1);
  });

  test("503 stays on same key (no rotation)", async () => {
    setEnv({ GEMINI_API_KEY_1: "num-key-1", GEMINI_API_KEY_2: "num-key-2" });
    const seen: number[] = [];
    __setGenerateTextOverride(async (slot) => {
      seen.push(slot.slot);
      throw transient503();
    });
    let msg = "";
    try {
      await generateStructuredJson("p", "s", schema, {}, 2);
    } catch (e: any) {
      msg = e.message;
    }
    expect(msg).toMatch(/LLM Fatal Error/);
    expect(seen.length).toBe(2);
    expect(seen.every((s) => s === 1)).toBe(true);
    expect(getLlmStats().keyRotations).toBe(0);
    expect(getLlmStats().exhaustedKeys).toBe(0);
  });

  test("per-minute 429 stays on same key (no rotation)", async () => {
    setEnv({ GEMINI_API_KEY_1: "num-key-1", GEMINI_API_KEY_2: "num-key-2" });
    const seen: number[] = [];
    __setGenerateTextOverride(async (slot) => {
      seen.push(slot.slot);
      throw rpmError();
    });
    try {
      await generateStructuredJson("p", "s", schema, {}, 2);
    } catch {
      // expected
    }
    expect(seen.every((s) => s === 1)).toBe(true);
    expect(getLlmStats().keyRotations).toBe(0);
    expect(getLlmStats().exhaustedKeys).toBe(0);
  });

  test("malformed JSON stays on same key", async () => {
    setEnv({ GEMINI_API_KEY_1: "num-key-1", GEMINI_API_KEY_2: "num-key-2" });
    const seen: number[] = [];
    __setGenerateTextOverride(async (slot) => {
      seen.push(slot.slot);
      return "not-json{{{";
    });
    try {
      await generateStructuredJson("p", "s", schema, {}, 2);
    } catch {
      // expected
    }
    expect(seen.length).toBe(2);
    expect(seen.every((s) => s === 1)).toBe(true);
    expect(getLlmStats().keyRotations).toBe(0);
  });

  test("schema validation failure stays on same key", async () => {
    setEnv({ GEMINI_API_KEY_1: "num-key-1", GEMINI_API_KEY_2: "num-key-2" });
    const seen: number[] = [];
    __setGenerateTextOverride(async (slot) => {
      seen.push(slot.slot);
      return JSON.stringify({ wrong: "shape" });
    });
    try {
      await generateStructuredJson("p", "s", schema, {}, 2);
    } catch {
      // expected
    }
    expect(seen.every((s) => s === 1)).toBe(true);
    expect(getLlmStats().keyRotations).toBe(0);
  });

  test("stats count HTTP attempts and rotations; no credentials in errors/logs", async () => {
    const fake1 = "fake-secret-slot-1-zzz";
    const fake2 = "fake-secret-slot-2-zzz";
    setEnv({ GEMINI_API_KEY_1: fake1, GEMINI_API_KEY_2: fake2 });
    __setGenerateTextOverride(async (slot) => {
      if (slot.slot === 1) throw dailyQuotaError();
      return OK_JSON;
    });
    await generateStructuredJson("p", "s", schema, {}, 1);
    const stats = getLlmStats();
    expect(stats.totalHttpRequests).toBe(2);
    expect(stats.failedAttempts).toBe(1);
    expect(stats.retryCount).toBeGreaterThanOrEqual(1);
    expect(JSON.stringify(stats)).not.toContain(fake1);
    expect(JSON.stringify(stats)).not.toContain(fake2);
    // Failure message must not leak keys either.
    __setGenerateTextOverride(async () => {
      throw transient503();
    });
    resetLlmStats();
    resetKeyRotationState();
    let msg = "";
    try {
      await generateStructuredJson("p", "s", schema, {}, 1);
    } catch (e: any) {
      msg = e.message;
    }
    expect(msg).not.toContain(fake1);
    expect(msg).not.toContain(fake2);
  });

  test("isDailyQuotaExhausted classification", () => {
    expect(isDailyQuotaExhausted(dailyQuotaError())).toBe(true);
    expect(
      isDailyQuotaExhausted(new Error("GenerateRequestsPerDayPerProjectPerModel quota exceeded"))
    ).toBe(true);
    expect(isDailyQuotaExhausted(rpmError())).toBe(false);
    expect(isDailyQuotaExhausted(transient503())).toBe(false);
    expect(isDailyQuotaExhausted(new Error("fetch failed: network down"))).toBe(false);
    expect(isDailyQuotaExhausted(new Error("Unexpected token } in JSON"))).toBe(false);
  });
});
