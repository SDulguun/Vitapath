import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getHistoryForUser } from "@/lib/history/data";
import { ScoreTrendChart } from "./_components/ScoreTrendChart";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const entries = await getHistoryForUser(supabase);

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <section className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
          VitaPath · History
        </p>
        <h1 className="mt-3 text-4xl">Your history</h1>
        <p className="mt-2 text-stone-600" data-testid="history-greeting">
          Signed in as {user.email}
        </p>

        {entries.length === 0 ? (
          <div className="mt-12">
            <p className="text-stone-600">
              You haven&apos;t completed a quiz yet. Your score trend will
              appear here once you do.
            </p>
            <Link
              href="/quiz/1"
              className="mt-6 inline-block rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-stone-50"
            >
              Take the quiz
            </Link>
          </div>
        ) : (
          <>
            {entries.length >= 2 && (
              <div className="mt-10" data-testid="trend-section">
                <h2 className="text-xs uppercase tracking-[0.2em] text-stone-500">
                  Score trend
                </h2>
                <div className="mt-3">
                  <ScoreTrendChart
                    points={entries.map((e) => ({
                      taken_at: e.taken_at,
                      score: e.health_score ?? 0,
                      quiz_id: e.quiz_id,
                    }))}
                  />
                </div>
              </div>
            )}

            <div className="mt-10">
              <h2 className="text-xs uppercase tracking-[0.2em] text-stone-500">
                Past quizzes ({entries.length})
              </h2>
              <ul className="mt-4 space-y-3" data-testid="history-list">
                {entries.map((e) => (
                  <li key={e.quiz_id}>
                    <Link
                      href={`/results/${e.quiz_id}`}
                      data-testid={`history-row-${e.quiz_id}`}
                      className="flex items-baseline justify-between gap-4 rounded-2xl border border-stone-200 bg-white px-5 py-4 transition hover:border-stone-400"
                    >
                      <div>
                        <p className="text-sm font-medium text-stone-900">
                          {new Date(e.taken_at).toLocaleString(undefined, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </p>
                        <p className="text-xs text-stone-500">
                          {e.rec_count} recommendation
                          {e.rec_count === 1 ? "" : "s"}
                        </p>
                      </div>
                      <p
                        className="text-2xl font-light tabular-nums text-stone-900"
                        data-testid={`history-score-${e.quiz_id}`}
                      >
                        {e.health_score ?? "–"}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        <form action="/auth/signout" method="post" className="mt-12">
          <button
            type="submit"
            data-testid="signout-button"
            className="rounded-full border border-stone-300 px-5 py-2 text-sm transition hover:border-stone-500"
          >
            Sign out
          </button>
        </form>
      </section>
    </main>
  );
}
