import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export type HistoryEntry = {
  quiz_id: string;
  taken_at: string;
  health_score: number | null;
  rec_count: number;
};

/**
 * Returns all completed quizzes for the authenticated user (RLS scoped),
 * newest first. Each entry carries the count of associated recommendations
 * so the list view can show "X recs" without a second query.
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
    .select("id, created_at, health_score, recommendations(id)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error || !quizzes) return [];

  return quizzes.map((q: {
    id: string;
    created_at: string;
    health_score: number | null;
    recommendations: { id: string }[] | null;
  }) => ({
    quiz_id: q.id,
    taken_at: q.created_at,
    health_score: q.health_score,
    rec_count: q.recommendations?.length ?? 0,
  }));
}
