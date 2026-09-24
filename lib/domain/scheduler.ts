import { Question, Requirement, Schedule, ScheduleDay } from "@/schemas/kit.schema";

export function generateSchedule(
  questions: Question[],
  requirements: Requirement[],
  daysAvailable: number
): Schedule {
  const nDays = Math.max(1, Math.floor(daysAvailable));

  if (questions.length === 0) {
    const emptyDays: ScheduleDay[] = Array.from({ length: nDays }, (_, i) => ({
      day: i + 1,
      focus: "Insufficient source material for question generation",
      question_ids: [],
      minutes: 0,
    }));

    return {
      days_available: nDays,
      days: emptyDays,
    };
  }

  const mustReqSet = new Set(
    requirements.filter((r) => r.priority === "must").map((r) => r.id)
  );

  const scoredQuestions = questions.map((q) => {
    const coversMust = q.requirement_ids.some((id) => mustReqSet.has(id));
    const score = (coversMust ? 10 : 0) + (q.difficulty || 2);
    return { question: q, score };
  });

  scoredQuestions.sort((a, b) => b.score - a.score);

  const dayBuckets: Question[][] = Array.from({ length: nDays }, () => []);

  scoredQuestions.forEach(({ question }, index) => {
    const dayIndex = index % nDays;
    dayBuckets[dayIndex].push(question);
  });

  const days: ScheduleDay[] = dayBuckets.map((bucket, i) => {
    const dayNum = i + 1;
    const questionIds = bucket.map((q) => q.id);
    const totalMinutes = bucket.reduce((sum, q) => sum + (q.difficulty * 15 || 25), 0);

    const categoryCounts: Record<string, number> = {};
    bucket.forEach((q) => {
      categoryCounts[q.category] = (categoryCounts[q.category] || 0) + 1;
    });

    let topCategory = "general-prep";
    let maxCount = 0;
    Object.entries(categoryCounts).forEach(([cat, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topCategory = cat;
      }
    });

    const focusTitle =
      topCategory === "technical"
        ? "Core Technical Concepts & Problem Solving"
        : topCategory === "system-design"
        ? "System Architecture & High-Level Design"
        : topCategory === "behavioural"
        ? "Behavioural Competencies & Situational Questions"
        : topCategory === "company-fit"
        ? "Company Culture, Values & Alignment"
        : "General Preparation & Practice";

    return {
      day: dayNum,
      focus: focusTitle,
      question_ids: questionIds,
      minutes: Math.round(totalMinutes),
    };
  });

  return {
    days_available: nDays,
    days,
  };
}
