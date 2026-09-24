import { expect, test, describe } from "bun:test";
import { runPipeline } from "@/lib/pipeline/orchestrator";
import { KitSchema } from "@/schemas/kit.schema";

describe("Single Pipeline Orchestrator", () => {
  test("processes job description and outputs Appendix A compliant Kit", async () => {
    if (!process.env.GEMINI_API_KEY) {
      process.env.MOCK_LLM = "true";
    }

    const mockJd = `
    Senior Frontend Engineer
    We are looking for a Senior Frontend Engineer with 5+ years of React experience.
    Must have deep understanding of Web Performance and System Architecture.
    Nice to have experience with GraphQL.
    `;

    const result = await runPipeline(
      {
        jd: mockJd,
        company_url: "http://localhost:8099/acme/",
        days: 5,
      },
      { allowLocalUrls: true }
    );

    expect(result.status).toBe("ok");
    expect(result.kit).not.toBeNull();
    if (result.kit) {
      const validation = KitSchema.safeParse(result.kit);
      expect(validation.success).toBe(true);
      expect(result.kit.schedule.days_available).toBe(5);
      expect(result.kit.schedule.days.length).toBe(5);
    }
  }, 15000);
});
