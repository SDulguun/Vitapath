import type { QuizAnswers } from "@/lib/quiz/schemas";

export type RecommendationRationale = {
  rule_id: string;
  reason: string;
};

export type Recommendation = {
  supplement_slug: string;
  name: string;
  dose: string;
  rule_ids: string[];
  rationale: RecommendationRationale[];
  pregnancy_safe: boolean;
};

export type Rule = {
  /** Stable identifier — never renumber, the engine + DB rationale rely on it. */
  id: string;
  description: string;
  supplement_slug: string;
  test: (answers: QuizAnswers) => boolean;
  rationale: (answers: QuizAnswers) => string;
};
