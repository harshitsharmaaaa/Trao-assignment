import { expect, test, describe } from "bun:test";
import { toExternalKit } from "@/lib/domain/toExternalKit";
import { KitSchema } from "@/schemas/kit.schema";

describe("Canonical External Kit Mapper", () => {
  test("strips internal-only database fields and produces Appendix A schema valid output", () => {
    const internalKitMock = {
      kitId: "kit-123",
      userId: "user-456",
      status: "ok",
      daysRequested: 3,
      source: {
        company: "Acme Corp",
        company_url: "https://acme.com",
        role: "Senior Frontend Engineer",
        location: "Remote",
        jd_chars: 1200,
        researched_at: "2026-09-01T09:00:00Z",
        pages_used: ["https://acme.com/about"],
      },
      company_brief: {
        summary: "Leading tech platform",
        what_they_do: "Builds enterprise web applications",
        sources: ["https://acme.com/about"],
        user_edited: true, // internal field
      },
      role: {
        title: "Senior Frontend Engineer",
        seniority: "Senior",
        responsibilities: ["Develop UI components"],
        requirements: [
          { id: "r1", text: "React experience", kind: "technical", priority: "must" },
        ],
      },
      questions: [
        {
          id: "q1",
          requirement_ids: ["r1"],
          category: "technical",
          prompt: "Explain React Reconciliation",
          answer_outline: "Fiber tree diffing",
          difficulty: 2,
          user_edited: true, // internal field
          is_custom: false, // internal field
        },
      ],
      flashcards: [
        {
          id: "f1",
          front: "What is Virtual DOM?",
          back: "In-memory DOM representation",
          requirement_ids: ["r1"],
          confidence: 4, // internal field
        },
      ],
      schedule: {
        days_available: 3,
        days: [
          {
            day: 1,
            focus: "React Concepts",
            question_ids: ["q1"],
            minutes: 30,
          },
        ],
      },
      coverage: {
        uncovered_requirement_ids: [],
        passes: 1,
      },
    };

    const external = toExternalKit(internalKitMock);

    // Verify Zod parsing succeeds
    const parseResult = KitSchema.safeParse(external);
    expect(parseResult.success).toBe(true);

    // Verify internal fields are stripped
    expect((external.company_brief as any).user_edited).toBeUndefined();
    expect((external.questions[0] as any).user_edited).toBeUndefined();
    expect((external.flashcards[0] as any).confidence).toBeUndefined();
  });
});
