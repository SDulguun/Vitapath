// Pure presentational component — accepts an already-assembled Results object
// and renders the score gauge, warnings, and recommendation cards. Used by
// /results (latest), /results/[id] (specific quiz), and /r/[token] (public
// shared view, mode="shared").
import Link from "next/link";
import type { Results } from "@/lib/results/data";
import { getSupplement } from "@/lib/engine/data";
import {
  chooseAlternative,
  getPrimaryBrand,
} from "@/lib/engine/alternatives";
import { RecCard } from "./RecCard";
import { ShareButton } from "./ShareButton";

const sevTone: Record<string, string> = {
  high: "border-red-300 bg-red-50 text-red-900",
  moderate: "border-amber-300 bg-amber-50 text-amber-900",
  low: "border-stone-300 bg-stone-50 text-stone-700",
};

export function ResultsView({
  results,
  isHistorical = false,
  mode = "personal",
}: {
  results: Results;
  isHistorical?: boolean;
  /** "personal" — owner viewing their own result; show share + history CTAs.
   *  "shared"   — anonymous public view via /r/[token]; hide auth CTAs. */
  mode?: "personal" | "shared";
}) {
  const { score, recommendations, warnings, taken_at } = results;
  const scorePct = Math.max(0, Math.min(100, score.score));
  const taken = new Date(taken_at).toLocaleString();

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <section className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
          VitaPath · {mode === "shared" ? "Shared result" : isHistorical ? "Past result" : "Results"}
        </p>
        <h1 className="mt-3 text-4xl">Your stack</h1>
        <p className="mt-1 text-sm text-stone-500">Saved {taken}</p>

        {/* Score gauge */}
        <div
          data-testid="score-section"
          className="mt-10 rounded-3xl border border-stone-200 bg-white p-8"
        >
          <div className="flex items-baseline justify-between">
            <p className="text-sm font-medium text-stone-600">Health score</p>
            <p className="text-xs text-stone-500">baseline {score.baseline}</p>
          </div>
          <div className="mt-3 flex items-baseline gap-3">
            <p
              data-testid="score-value"
              className="text-6xl font-light tabular-nums"
            >
              {score.score}
            </p>
            <p className="text-sm text-stone-500">/ 100</p>
          </div>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-stone-200">
            <div
              className="h-full bg-stone-900 transition-all"
              style={{ width: `${scorePct}%` }}
              aria-hidden
            />
          </div>

          {score.contributions.length > 0 && (
            <details className="mt-6 group" data-testid="score-contributions">
              <summary className="cursor-pointer text-sm text-stone-600 hover:text-stone-900">
                What moved your score? ({score.contributions.length})
              </summary>
              <ul className="mt-4 space-y-2">
                {score.contributions.map((c) => (
                  <li
                    key={c.rule_id}
                    className="flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50 px-4 py-2 text-sm"
                  >
                    <span>{c.label}</span>
                    <span
                      className={
                        c.delta > 0
                          ? "font-medium tabular-nums text-emerald-700"
                          : "font-medium tabular-nums text-red-700"
                      }
                    >
                      {c.delta > 0 ? "+" : ""}
                      {c.delta}
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>

        {/* Warnings */}
        {warnings.length > 0 && (
          <div data-testid="warnings-section" className="mt-10 space-y-3">
            <h2 className="text-xs uppercase tracking-[0.2em] text-stone-500">
              Heads-up
            </h2>
            {warnings.map((w) => (
              <div
                key={w.id}
                data-testid={`warning-${w.kind}`}
                className={`rounded-xl border px-4 py-3 text-sm ${sevTone[w.severity] ?? sevTone.low}`}
              >
                <p className="font-medium uppercase tracking-wider text-xs">
                  {w.severity}
                </p>
                <p className="mt-1">{w.message}</p>
              </div>
            ))}
          </div>
        )}

        {/* Recommendations */}
        <div className="mt-10">
          <h2 className="text-xs uppercase tracking-[0.2em] text-stone-500">
            Recommendations ({recommendations.length})
          </h2>
          {recommendations.length === 0 ? (
            <p className="mt-4 text-stone-600">
              No supplements were flagged for your profile. Your routine looks
              well-covered.
            </p>
          ) : (
            <ul className="mt-4 space-y-4" data-testid="rec-list">
              {recommendations.map((r) => {
                const supp = getSupplement(r.supplement_slug);
                const primary = supp ? getPrimaryBrand(supp) : null;
                const alternative = supp ? chooseAlternative(supp) : null;
                if (!primary) return null;
                return (
                  <RecCard
                    key={r.supplement_slug}
                    rec={r}
                    primary={primary}
                    alternative={alternative}
                  />
                );
              })}
            </ul>
          )}
        </div>

        {/* Disclaimer + actions */}
        <p className="mt-10 text-xs text-stone-500">
          VitaPath provides general dietary guidance, not medical advice. Talk
          to a clinician before starting, stopping, or combining any
          supplement.
        </p>
        {mode === "shared" ? (
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/"
              className="rounded-full border border-stone-300 px-5 py-2 text-sm transition hover:border-stone-500"
            >
              About VitaPath
            </Link>
            <Link
              href="/quiz/1"
              className="rounded-full bg-stone-900 px-5 py-2 text-sm font-medium text-stone-50 transition hover:bg-stone-700"
            >
              Get your own
            </Link>
          </div>
        ) : (
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/quiz/1"
              className="rounded-full border border-stone-300 px-5 py-2 text-sm transition hover:border-stone-500"
            >
              Re-take the quiz
            </Link>
            <Link
              href="/history"
              className="rounded-full border border-stone-300 px-5 py-2 text-sm transition hover:border-stone-500"
            >
              View history
            </Link>
            <ShareButton quizId={results.quiz_id} />
          </div>
        )}
      </section>
    </main>
  );
}
