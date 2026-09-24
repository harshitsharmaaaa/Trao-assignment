import { expect, test, describe, beforeEach } from "bun:test";
import {
  resolveRequestsPerMinute,
  acquireRateSlot,
  resetRateLimiter,
  getLlmStats,
  resetLlmStats,
} from "@/lib/llm/client";

describe("LLM provider rate limiter + stats", () => {
  beforeEach(() => {
    resetRateLimiter();
    resetLlmStats();
    delete process.env.LLM_REQUESTS_PER_MINUTE;
  });

  test("defaults to 5 requests/minute when unset", () => {
    expect(resolveRequestsPerMinute()).toBe(5);
  });

  test("honours a valid override and clamps invalid values to default", () => {
    process.env.LLM_REQUESTS_PER_MINUTE = "2";
    expect(resolveRequestsPerMinute()).toBe(2);

    process.env.LLM_REQUESTS_PER_MINUTE = "not-a-number";
    expect(resolveRequestsPerMinute()).toBe(5);

    process.env.LLM_REQUESTS_PER_MINUTE = "0";
    expect(resolveRequestsPerMinute()).toBe(5);

    process.env.LLM_REQUESTS_PER_MINUTE = "-3";
    expect(resolveRequestsPerMinute()).toBe(5);
  });

  test("admits immediately while under the limit", async () => {
    process.env.LLM_REQUESTS_PER_MINUTE = "1000";
    const started = Date.now();
    await acquireRateSlot();
    await acquireRateSlot();
    await acquireRateSlot();
    expect(Date.now() - started).toBeLessThan(5000);
  });

  test("stats start zeroed, expose only counts, and reset", () => {
    const stats = getLlmStats();
    expect(stats).toEqual({
      successfulCalls: 0,
      failedCalls: 0,
      totalHttpRequests: 0,
      failedAttempts: 0,
      retryCount: 0,
      totalRuntimeMs: 0,
    });
    // Serialized snapshot must not contain secrets or content by construction.
    expect(JSON.stringify(stats)).not.toMatch(/key|prompt|token/i);
    resetLlmStats();
    expect(getLlmStats().totalHttpRequests).toBe(0);
  });
});
