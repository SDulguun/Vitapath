// Public read of a shared quiz via the get_shared_result security-definer
// RPC defined in supabase/migrations/0001_init.sql. Uses the anon key so
// unauthenticated visitors can resolve a /r/[token] page.
import "server-only";
import { createServerClient } from "@supabase/ssr";
import { QuizAnswersSchema } from "@/lib/quiz/schemas";
import { recommend } from "@/lib/engine/rules";
import { computeScore } from "@/lib/engine/score";
import { checkInteractions } from "@/lib/engine/interactions";
import { getSupplement } from "@/lib/engine/data";
import type { Results, ResultsRecommendation } from "@/lib/results/data";

export type SharedResult =
  | { kind: "ok"; results: Results; expires_at: string }
  | { kind: "expired_or_unknown" };

type RpcRow = {
  quiz_id: string;
  health_score: number | null;
  answers: unknown;
  recommendations: unknown;
  shared_at: string;
  expires_at: string;
};

/**
 * Anonymous Supabase client — no cookies, no session. Safe to call from a
 * public route handler / server component.
 */
function anonClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          /* no-op */
        },
      },
    },
  );
}

export async function getSharedResult(token: string): Promise<SharedResult> {
  // Defensive bound on token shape — base64url is [A-Za-z0-9_-]
  if (!/^[A-Za-z0-9_-]+$/.test(token) || token.length < 16 || token.length > 64) {
    return { kind: "expired_or_unknown" };
  }

  const supabase = anonClient();
  const { data, error } = await supabase.rpc("get_shared_result", {
    p_token: token,
  });

  if (error || !data || (Array.isArray(data) && data.length === 0)) {
    return { kind: "expired_or_unknown" };
  }

  const row = (Array.isArray(data) ? data[0] : data) as RpcRow;
  const parsed = QuizAnswersSchema.safeParse(row.answers);
  if (!parsed.success) return { kind: "expired_or_unknown" };

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
    kind: "ok",
    expires_at: row.expires_at,
    results: {
      quiz_id: row.quiz_id,
      taken_at: row.shared_at,
      answers,
      score,
      recommendations,
      warnings,
    },
  };
}
