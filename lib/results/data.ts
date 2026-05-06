// Server-only assembler that loads a quiz row, attaches engine output, and
// formats the results data the /results page renders.
import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { QuizAnswersSchema, type QuizAnswers } from "@/lib/quiz/schemas";
import { recommend } from "@/lib/engine/rules";
import { computeScore, type HealthScore } from "@/lib/engine/score";
import { checkInteractions, type Warning } from "@/lib/engine/interactions";
import { getSupplement } from "@/lib/engine/data";
import type { Recommendation } from "@/lib/engine/types";
import type { Study } from "@/lib/engine/schemas";

export type ResultsRecommendation = Recommendation & {
  evidence: Study[];
};

export type Results = {
  quiz_id: string;
  taken_at: string;
  answers: QuizAnswers;
  score: HealthScore;
  recommendations: ResultsRecommendation[];
  warnings: Warning[];
};

type QuizRow = {
  id: string;
  created_at: string;
  answers: unknown;
  health_score: number | null;
};

function assembleFromRow(row: QuizRow): Results | null {
  const parsed = QuizAnswersSchema.safeParse(row.answers);
  if (!parsed.success) return null;
  const answers = parsed.data;
  const score = computeScore(answers);
  const rawRecs = recommend(answers);
  const { recommendations: finalRecs, warnings } = checkInteractions(
    answers,
    rawRecs,
  );
  const recommendations: ResultsRecommendation[] = finalRecs.map((r) => {
    const supp = getSupplement(r.supplement_slug);
    return { ...r, evidence: supp?.studies ?? [] };
  });
  return {
    quiz_id: row.id,
    taken_at: row.created_at,
    answers,
    score,
    recommendations,
    warnings,
  };
}

/**
 * Load the latest quiz for the current user (RLS scoped) and assemble the
 * full results payload. Returns null if the user has no quizzes yet.
 */
export async function getLatestResultsForUser(
  supabase: SupabaseClient,
): Promise<Results | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: quiz, error } = await supabase
    .from("quizzes")
    .select("id, created_at, answers, health_score")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !quiz) return null;
  return assembleFromRow(quiz as QuizRow);
}

/**
 * Load a specific quiz by id. RLS limits this to quizzes owned by the
 * authenticated user, so an arbitrary id from another user yields null.
 */
export async function getResultsByQuizId(
  supabase: SupabaseClient,
  quizId: string,
): Promise<Results | null> {
  // Lightweight UUID guard — RLS would block invalid ids anyway, but this
  // avoids a Supabase round-trip for obviously malformed strings.
  if (!/^[0-9a-fA-F-]{36}$/.test(quizId)) return null;

  const { data: quiz, error } = await supabase
    .from("quizzes")
    .select("id, created_at, answers, health_score")
    .eq("id", quizId)
    .maybeSingle();

  if (error || !quiz) return null;
  return assembleFromRow(quiz as QuizRow);
}
