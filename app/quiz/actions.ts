"use server";

import { createClient } from "@/lib/supabase/server";
import { QuizAnswersSchema, type QuizAnswers } from "@/lib/quiz/schemas";

export type SaveQuizResult =
  | { error?: undefined; quizId: string }
  | { error: string; quizId?: undefined };

export async function saveQuiz(answers: QuizAnswers): Promise<SaveQuizResult> {
  const parsed = QuizAnswersSchema.safeParse(answers);
  if (!parsed.success) {
    return {
      error:
        "Some answers were missing or invalid. Please complete every step.",
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

  const { data, error } = await supabase
    .from("quizzes")
    .insert({
      user_id: user.id,
      answers: parsed.data,
      health_score: null, // populated by goal 8 once the engine ships
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { quizId: data.id };
}
