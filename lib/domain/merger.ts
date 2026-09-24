import { Question, CompanyBrief } from "@/schemas/kit.schema";

export interface InternalQuestion extends Question {
  user_edited?: boolean;
  is_custom?: boolean;
}

export interface InternalCompanyBrief extends CompanyBrief {
  user_edited?: boolean;
}

export function mergeCategoryRegeneration(
  existingQuestions: InternalQuestion[],
  newCategoryQuestions: Question[],
  targetCategory: string
): InternalQuestion[] {
  const preservedQuestions = existingQuestions.filter(
    (q) => q.category !== targetCategory || q.user_edited === true || q.is_custom === true
  );

  const preservedIds = new Set(preservedQuestions.map((q) => q.id));
  const freshQuestions = newCategoryQuestions.filter((q) => !preservedIds.has(q.id));

  return [...preservedQuestions, ...freshQuestions];
}

export function mergeCompanyBriefRegeneration(
  existingBrief: InternalCompanyBrief,
  newBrief: CompanyBrief
): InternalCompanyBrief {
  if (existingBrief.user_edited) {
    return existingBrief;
  }
  return { ...newBrief, user_edited: false };
}
