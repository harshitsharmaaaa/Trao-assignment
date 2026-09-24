import { Requirement, Question, Coverage } from "@/schemas/kit.schema";

export function checkCoverage(
  requirements: Requirement[],
  questions: Question[],
  passesExecuted: number
): Coverage {
  const mustRequirementIds = requirements
    .filter((req) => req.priority === "must")
    .map((req) => req.id);

  const coveredSet = new Set<string>();

  for (const question of questions) {
    for (const reqId of question.requirement_ids) {
      coveredSet.add(reqId);
    }
  }

  const uncovered_requirement_ids = mustRequirementIds.filter(
    (reqId) => !coveredSet.has(reqId)
  );

  return {
    uncovered_requirement_ids,
    passes: passesExecuted,
  };
}
