import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupplement } from "@/lib/engine/data";

export type HistoryEntry = {
  quiz_id: string;
  taken_at: string;
  health_score: number | null;
  rec_count: number;
  /** Up to 3 supplement display names, in DB order, for the card chip row. */
  top_recs: string[];
};

/**
 * Returns all completed quizzes for the authenticated user (RLS scoped),
 * newest first. Each entry carries:
 *   - rec_count: how many recommendations the engine produced
 *   - top_recs:  up to 3 supplement names for the card chip row (resolved
 *                from supplements.json via getSupplement)
 */
export async function getHistoryForUser(
  supabase: SupabaseClient,
): Promise<HistoryEntry[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: quizzes, error } = await supabase
    .from("quizzes")
    .select(
      "id, created_at, health_score, recommendations(id, supplement_slug)",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error || !quizzes) return [];

  return quizzes.map(
    (q: {
      id: string;
      created_at: string;
      health_score: number | null;
      recommendations: { id: string; supplement_slug: string }[] | null;
    }) => {
      const recs = q.recommendations ?? [];
      const top_recs: string[] = [];
      for (const r of recs.slice(0, 3)) {
        const name = getSupplement(r.supplement_slug)?.name;
        if (name) top_recs.push(name);
      }
      return {
        quiz_id: q.id,
        taken_at: q.created_at,
        health_score: q.health_score,
        rec_count: recs.length,
        top_recs,
      };
    },
  );
}
