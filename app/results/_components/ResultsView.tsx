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
import { ScoreGauge, WarningCallouts } from "@/app/_components";
import { RecCard } from "./RecCard";
import { ShareButton } from "./ShareButton";

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
        <div className="mt-10">
          <ScoreGauge
            score={score.score}
            baseline={score.baseline}
            contributions={score.contributions}
          />
        </div>

        {/* Warnings — surfaces the interaction engine output. Severity-tinted
            cards with icons, grouped + sorted high→low, with the removed
            supplement chip when applicable. */}
        {warnings.length > 0 && (
          <div className="mt-10">
            <WarningCallouts
              warnings={warnings}
              resolveSupplementName={(slug) => getSupplement(slug)?.name}
            />
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
