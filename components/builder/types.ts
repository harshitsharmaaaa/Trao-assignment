export type QuestionCategory = "technical" | "behavioural" | "system-design" | "company-fit";

export const QUESTION_CATEGORIES: QuestionCategory[] = [
  "technical",
  "system-design",
  "behavioural",
  "company-fit",
];

export interface BuilderQuestion {
  id: string;
  requirement_ids: string[];
  category: QuestionCategory;
  prompt: string;
  answer_outline: string;
  difficulty: number;
  user_edited?: boolean;
  is_custom?: boolean;
}

export interface BuilderFlashcard {
  id: string;
  front: string;
  back: string;
  requirement_ids: string[];
  user_edited?: boolean;
}

export interface BuilderRequirement {
  id: string;
  text: string;
  kind: "technical" | "behavioural" | "domain";
  priority: "must" | "nice";
}

export function categoryLabel(category: QuestionCategory): string {
  return category.replace("-", " ");
}

export function newCustomQuestionId(): string {
  return `q_custom_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

export function newCustomFlashcardId(): string {
  return `f_custom_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}
