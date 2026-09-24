import { expect, test, describe } from "bun:test";
import { mergeCategoryRegeneration, mergeCompanyBriefRegeneration, InternalQuestion } from "@/lib/domain/merger";

describe("State Merger (Regeneration Edit Preservation)", () => {
  test("preserves user-edited question during category regeneration", () => {
    const existingQuestions: InternalQuestion[] = [
      {
        id: "q1",
        requirement_ids: ["r1"],
        category: "technical",
        prompt: "USER EDITED PROMPT: Explain React Fiber",
        answer_outline: "Custom outline",
        difficulty: 3,
        user_edited: true,
      },
      {
        id: "q2",
        requirement_ids: ["r1"],
        category: "technical",
        prompt: "Unedited generated question",
        answer_outline: "Old outline",
        difficulty: 1,
        user_edited: false,
      },
      {
        id: "q3",
        requirement_ids: ["r2"],
        category: "behavioural",
        prompt: "Tell me about a conflict",
        answer_outline: "STAR method",
        difficulty: 2,
      },
    ];

    const newCategoryQuestions = [
      {
        id: "q4",
        requirement_ids: ["r1"],
        category: "technical",
        prompt: "Brand new generated question",
        answer_outline: "New outline",
        difficulty: 2,
      },
    ];

    const merged = mergeCategoryRegeneration(
      existingQuestions,
      newCategoryQuestions as any,
      "technical"
    );

    expect(merged.find((q) => q.id === "q1")).toBeDefined();
    expect(merged.find((q) => q.id === "q1")?.prompt).toContain("USER EDITED PROMPT");
    expect(merged.find((q) => q.id === "q2")).toBeUndefined();
    expect(merged.find((q) => q.id === "q3")).toBeDefined();
    expect(merged.find((q) => q.id === "q4")).toBeDefined();
  });

  test("preserves company brief if user edited it", () => {
    const existingBrief = {
      summary: "User edited summary",
      what_they_do: "User edited what they do",
      sources: ["https://acme.com"],
      user_edited: true,
    };

    const newBrief = {
      summary: "Newly generated summary",
      what_they_do: "Newly generated what they do",
      sources: ["https://acme.com"],
    };

    const merged = mergeCompanyBriefRegeneration(existingBrief, newBrief);
    expect(merged.summary).toBe("User edited summary");
  });
});
