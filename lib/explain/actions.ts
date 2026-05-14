"use server";

import Groq from "groq-sdk";
import { createClient } from "@/lib/supabase/server";
import { QuizAnswersSchema } from "@/lib/quiz/schemas";
import { recommend } from "@/lib/engine/rules";
import { checkInteractions } from "@/lib/engine/interactions";
import { getSupplement } from "@/lib/engine/data";
import type { ResultsRecommendation } from "@/lib/results/data";
import { SYSTEM_PROMPT, buildPrompt } from "./prompt";

export type ExplanationResult =
  | { ok: true; text: string; cached: boolean }
  | { ok: false; error: string };

const UUID_RE = /^[0-9a-fA-F-]{36}$/;
const SLUG_RE = /^[a-z0-9_]{2,40}$/;

/**
 * Generate (or return cached) "Why this for me?" explanation for a
 * single recommendation. The client only sends quizId + supplementSlug;
 * the server rebuilds the recommendation from the DB so the prompt can
 * never be tampered with from the browser.
 *
 * Caches successful responses in public.rec_explanations (migration 0003,
 * RLS-scoped to the quiz owner). Subsequent calls for the same key are
 * free.
 */
export async function generateExplanation({
  quizId,
  supplementSlug,
}: {
  quizId: string;
  supplementSlug: string;
}): Promise<ExplanationResult> {
  if (!UUID_RE.test(quizId)) {
    return { ok: false, error: "Invalid quiz id." };
  }
  if (!SLUG_RE.test(supplementSlug)) {
    return { ok: false, error: "Invalid supplement slug." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Sign in to see explanations." };
  }

  // Cache hit?
  const { data: cached } = await supabase
    .from("rec_explanations")
    .select("explanation")
    .eq("quiz_id", quizId)
    .eq("supplement_slug", supplementSlug)
    .maybeSingle();
  if (cached?.explanation) {
    return { ok: true, text: cached.explanation, cached: true };
  }

  // Reload the quiz (RLS verifies ownership) and rebuild the
  // recommendation so the prompt grounds on trusted server data.
  const { data: quiz } = await supabase
    .from("quizzes")
    .select("id, answers")
    .eq("id", quizId)
    .maybeSingle();
  if (!quiz) {
    return { ok: false, error: "Quiz not found." };
  }
  const parsed = QuizAnswersSchema.safeParse(quiz.answers);
  if (!parsed.success) {
    return { ok: false, error: "Quiz data is invalid." };
  }
  const { recommendations: finalRecs } = checkInteractions(
    parsed.data,
    recommend(parsed.data),
  );
  const target = finalRecs.find((r) => r.supplement_slug === supplementSlug);
  if (!target) {
    return { ok: false, error: "Recommendation not found for this quiz." };
  }
  const supp = getSupplement(supplementSlug);
  const rec: ResultsRecommendation = {
    ...target,
    evidence: supp?.studies ?? [],
  };

  if (!process.env.GROQ_API_KEY) {
    return {
      ok: false,
      error: "Explanations are not configured. Please try again later.",
    };
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  let text: string;
  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildPrompt(rec) },
      ],
      temperature: 0.5,
      max_tokens: 220,
    });
    text = completion.choices[0]?.message?.content?.trim() ?? "";
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? `LLM request failed: ${err.message}`
          : "LLM request failed.",
    };
  }
  if (!text) {
    return { ok: false, error: "Empty response from the model." };
  }

  // Best-effort cache write. If it fails (e.g., RLS edge case), still
  // return the text so the user sees their explanation.
  await supabase
    .from("rec_explanations")
    .insert({
      quiz_id: quizId,
      supplement_slug: supplementSlug,
      explanation: text,
    });

  return { ok: true, text, cached: false };
}
