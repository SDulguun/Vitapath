"use server";

import { createClient } from "@/lib/supabase/server";
import { QuizAnswersSchema, type QuizAnswers } from "@/lib/quiz/schemas";
import { recommend } from "@/lib/engine/rules";
import { computeScore } from "@/lib/engine/score";

export type SaveQuizResult =
  | { error?: undefined; quizId: string }
  | { error: string; quizId?: undefined };

export async function saveQuiz(answers: QuizAnswers): Promise<SaveQuizResult> {
  const parsed = QuizAnswersSchema.safeParse(answers);
  if (!parsed.success) {
    return {
      error: "Some answers were missing or invalid. Please complete every step.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "You must be signed in to save a quiz." };
  }

  // Run the engine + score against the validated answers.
  const score = computeScore(parsed.data);
  const recommendations = recommend(parsed.data);

  // 1. Insert the quiz row with computed score.
  const { data: quizRow, error: quizErr } = await supabase
    .from("quizzes")
    .insert({
      user_id: user.id,
      answers: parsed.data,
      health_score: score.score,
    })
    .select("id")
    .single();

  if (quizErr) return { error: quizErr.message };

  // 2. Insert one recommendations row per surviving rec. The interaction
  //    checker (goal 9) is intentionally NOT applied here — we store the
  //    full rule output and let the results page recompute warnings live so
  //    they reflect the user's current med list (e.g. after editing /profile).
  if (recommendations.length > 0) {
    const recRows = recommendations.map((r) => ({
      quiz_id: quizRow.id,
      supplement_slug: r.supplement_slug,
      dose: r.dose,
      rationale: {
        rule_ids: r.rule_ids,
        rationale: r.rationale,
        name: r.name,
        pregnancy_safe: r.pregnancy_safe,
      },
      evidence_refs: null,
    }));

    const { error: recErr } = await supabase
      .from("recommendations")
      .insert(recRows);

    // If recs fail, the quiz row still stands — surface the error but don't
    // try to roll back (no client-side transactions in supabase-js).
    if (recErr) return { error: recErr.message };
  }

  return { quizId: quizRow.id };
}
