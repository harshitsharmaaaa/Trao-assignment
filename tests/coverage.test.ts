import { expect, test, describe } from "bun:test";
import { checkCoverage } from "@/lib/domain/coverage";
import { Requirement, Question } from "@/schemas/kit.schema";

describe("Coverage Checker", () => {
  const mockRequirements: Requirement[] = [
    { id: "r1", text: "5+ years React", kind: "technical", priority: "must" },
    { id: "r2", text: "System design skills", kind: "technical", priority: "must" },
    { id: "r3", text: "Nice to have GraphQL", kind: "technical", priority: "nice" },
  ];

  test("returns empty uncovered list when all MUST requirements are covered", () => {
    const mockQuestions: Question[] = [
      {
        id: "q1",
        requirement_ids: ["r1"],
        category: "technical",
        prompt: "Explain React Reconciliation",
        answer_outline: "Fiber tree diffing...",
        difficulty: 2,
      },
      {
        id: "q2",
        requirement_ids: ["r2"],
        category: "system-design",
        prompt: "Design a URL Shortener",
        answer_outline: "Hashing + Key Value Cache...",
        difficulty: 3,
      },
    ];

    const result = checkCoverage(mockRequirements, mockQuestions, 1);
    expect(result.uncovered_requirement_ids).toEqual([]);
    expect(result.passes).toBe(1);
  });

  test("identifies missing MUST requirements correctly", () => {
    const mockQuestions: Question[] = [
      {
        id: "q1",
        requirement_ids: ["r1"],
        category: "technical",
        prompt: "Explain React Reconciliation",
        answer_outline: "Fiber tree diffing...",
        difficulty: 2,
      },
    ];

    const result = checkCoverage(mockRequirements, mockQuestions, 1);
    expect(result.uncovered_requirement_ids).toEqual(["r2"]);
    expect(result.passes).toBe(1);
  });

  test("ignores uncovered NICE-to-have requirements in coverage gaps", () => {
    const mockQuestions: Question[] = [
      {
        id: "q1",
        requirement_ids: ["r1", "r2"],
        category: "technical",
        prompt: "React and System Architecture",
        answer_outline: "Details...",
        difficulty: 2,
      },
    ];

    const result = checkCoverage(mockRequirements, mockQuestions, 1);
    expect(result.uncovered_requirement_ids).toEqual([]);
  });
});
