import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Button,
  buttonClasses,
  Card,
  Container,
  Eyebrow,
  PageHeading,
  SectionHeading,
} from "@/app/_components";
import { createClient } from "@/lib/supabase/server";
import { getHistoryForUser, type HistoryEntry } from "@/lib/history/data";
import { ScoreTrendChart } from "./_components/ScoreTrendChart";

export const dynamic = "force-dynamic";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/** Render the delta vs the immediately-previous (older) quiz in sage for
 *  positive, terracotta for negative. Returns null if there is no prior
 *  reference point or either score is missing. */
function ScoreDelta({
  current,
  previous,
}: {
  current: number | null;
  previous: number | null;
}) {
  if (current == null || previous == null) return null;
  const delta = current - previous;
  if (delta === 0)
    return <span className="text-xs text-ink-muted">no change</span>;
  const tone = delta > 0 ? "text-sage-deep" : "text-terracotta";
  return (
    <span
      className={`text-xs font-medium tabular-nums ${tone}`}
      data-testid={`history-delta-${delta > 0 ? "up" : "down"}`}
    >
      {delta > 0 ? "+" : ""}
      {delta}
    </span>
  );
}

function HistoryCard({
  entry,
  previousScore,
}: {
  entry: HistoryEntry;
  previousScore: number | null;
}) {
  return (
    <Card
      className="flex flex-col gap-4 transition-all duration-fast hover:border-sage hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
      compact
      data-testid={`history-row-${entry.quiz_id}`}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-ink">{formatDate(entry.taken_at)}</p>
        <p className="text-xs text-ink-muted">
          {entry.rec_count} recommendation{entry.rec_count === 1 ? "" : "s"}
        </p>
        {entry.top_recs.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {entry.top_recs.map((name) => (
              <li
                key={name}
                className="rounded-pill bg-sage-soft px-2.5 py-0.5 text-xs text-sage-deep"
              >
                {name}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:gap-1">
        <div className="flex items-baseline gap-2">
          <span
            className="font-serif text-3xl text-ink tabular-nums"
            data-testid={`history-score-${entry.quiz_id}`}
          >
            {entry.health_score ?? "–"}
          </span>
          <ScoreDelta current={entry.health_score} previous={previousScore} />
        </div>
        <Link
          href={`/results/${entry.quiz_id}`}
          className={buttonClasses("ghost", "md") + " -mr-2"}
        >
          View →
        </Link>
      </div>
    </Card>
  );
}

export default async function HistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const entries = await getHistoryForUser(supabase);

  return (
    <main className="py-12 md:py-16">
      <Container as="section">
        <Eyebrow>VitaPath · History</Eyebrow>
        <PageHeading
          className="mt-3"
          subtitle={<span data-testid="history-greeting">Signed in as {user.email}</span>}
        >
          Your history
        </PageHeading>

        {entries.length === 0 ? (
          <Card className="mt-10" tone="sage">
            <p className="text-sm text-ink-soft">
              You haven&apos;t completed a quiz yet. Your score trend will
              appear here once you do.
            </p>
            <div className="mt-5">
              <Link href="/quiz/1" className={buttonClasses("primary", "md")}>
                Take the quiz
              </Link>
            </div>
          </Card>
        ) : (
          <>
            {entries.length >= 2 && (
              <section className="mt-10" data-testid="trend-section">
                <SectionHeading>Score trend</SectionHeading>
                <div className="mt-4 rounded-lg border border-sage-soft/60 bg-surface p-4 shadow-sm">
                  <ScoreTrendChart
                    points={entries.map((e) => ({
                      taken_at: e.taken_at,
                      score: e.health_score ?? 0,
                      quiz_id: e.quiz_id,
                    }))}
                  />
                </div>
              </section>
            )}

            <section className="mt-10">
              <SectionHeading>Past quizzes ({entries.length})</SectionHeading>
              <ul className="mt-4 space-y-3" data-testid="history-list">
                {entries.map((entry, i) => {
                  // entries[i+1] is the next-older quiz (entries are
                  // newest-first), so its score is the "previous" reference
                  // for the delta indicator.
                  const previous = entries[i + 1]?.health_score ?? null;
                  return (
                    <li key={entry.quiz_id}>
                      <HistoryCard entry={entry} previousScore={previous} />
                    </li>
                  );
                })}
              </ul>
            </section>
          </>
        )}

        <form action="/auth/signout" method="post" className="mt-12">
          <Button
            type="submit"
            variant="secondary"
            data-testid="signout-button"
          >
            Sign out
          </Button>
        </form>
      </Container>
    </main>
  );
}
