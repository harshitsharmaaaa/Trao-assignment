import { expect, test, describe } from "bun:test";
import { generateSchedule } from "@/lib/domain/scheduler";
import { Question, Requirement } from "@/schemas/kit.schema";

describe("Deterministic Scheduler", () => {
  const mockRequirements: Requirement[] = [
    { id: "r1", text: "React experience", kind: "technical", priority: "must" },
    { id: "r2", text: "System design", kind: "technical", priority: "must" },
    { id: "r3", text: "CI/CD knowledge", kind: "technical", priority: "nice" },
  ];

  const mockQuestions: Question[] = [
    {
      id: "q1",
      requirement_ids: ["r1"],
      category: "technical",
      prompt: "React hooks explanation",
      answer_outline: "useState, useEffect...",
      difficulty: 2,
    },
    {
      id: "q2",
      requirement_ids: ["r2"],
      category: "system-design",
      prompt: "Design distributed cache",
      answer_outline: "Consistent hashing...",
      difficulty: 3,
    },
    {
      id: "q3",
      requirement_ids: ["r3"],
      category: "technical",
      prompt: "Docker multi-stage builds",
      answer_outline: "Optimization...",
      difficulty: 1,
    },
  ];

  test("generates exact number of requested days", () => {
    const schedule5 = generateSchedule(mockQuestions, mockRequirements, 5);
    expect(schedule5.days_available).toBe(5);
    expect(schedule5.days.length).toBe(5);
    expect(schedule5.days.map((d) => d.day)).toEqual([1, 2, 3, 4, 5]);

    const schedule1 = generateSchedule(mockQuestions, mockRequirements, 1);
    expect(schedule1.days_available).toBe(1);
    expect(schedule1.days.length).toBe(1);

    const schedule60 = generateSchedule(mockQuestions, mockRequirements, 60);
    expect(schedule60.days_available).toBe(60);
    expect(schedule60.days.length).toBe(60);
    expect(schedule60.days[59].day).toBe(60);
  });


  test("schedules high difficulty and MUST questions on earlier days", () => {
    const schedule = generateSchedule(mockQuestions, mockRequirements, 3);
    expect(schedule.days[0].question_ids).toContain("q2");
  });

  test("handles zero questions edge case gracefully", () => {
    const emptySchedule = generateSchedule([], mockRequirements, 4);
    expect(emptySchedule.days_available).toBe(4);
    expect(emptySchedule.days.length).toBe(4);
    expect(emptySchedule.days[0].question_ids).toEqual([]);
    expect(emptySchedule.days[0].minutes).toBe(0);
    expect(emptySchedule.days[0].focus).toContain("Insufficient");
  });

  test("ensures minutes are non-negative integers without floats", () => {
    const schedule = generateSchedule(mockQuestions, mockRequirements, 5);
    for (const day of schedule.days) {
      expect(Number.isInteger(day.minutes)).toBe(true);
      expect(day.minutes).toBeGreaterThanOrEqual(0);
    }
  });
});
