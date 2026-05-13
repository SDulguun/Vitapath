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
import {
  BackButton,
  buttonClasses,
  Container,
  Eyebrow,
  PageHeading,
  ScoreGauge,
  SectionHeading,
  WarningCallouts,
} from "@/app/_components";
import { ResultsInteractive, type RecRow } from "./ResultsInteractive";
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

  const eyebrow =
    mode === "shared"
      ? "VitaPath · Shared result"
      : isHistorical
        ? "VitaPath · Past result"
        : "VitaPath · Results";

  return (
    <main className="py-12 md:py-16">
      {/* Bottom padding here makes room on mobile for the sticky action
          bar below; md+ collapses that allowance. */}
      <Container as="section" className="pb-24 md:pb-0">
        <Eyebrow>{eyebrow}</Eyebrow>
        <PageHeading
          className="mt-3"
          subtitle={<>Saved {taken}</>}
        >
          Your stack
        </PageHeading>

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

        {/* Recommendations + BudgetBar (interactive client island) */}
        <div className="mt-10">
          <SectionHeading>
            Recommendations{" "}
            <span className="text-ink-muted">({recommendations.length})</span>
          </SectionHeading>
          {recommendations.length === 0 ? (
            <p className="mt-4 text-ink-soft">
              No supplements were flagged for your profile. Your routine looks
              well-covered.
            </p>
          ) : (
            (() => {
              const rows: RecRow[] = [];
              for (const r of recommendations) {
                const supp = getSupplement(r.supplement_slug);
                const primary = supp ? getPrimaryBrand(supp) : null;
                if (!supp || !primary) continue;
                rows.push({
                  rec: r,
                  primary,
                  alternative: chooseAlternative(supp),
                });
              }
              return (
                <div className="mt-6">
                  <ResultsInteractive rows={rows} />
                </div>
              );
            })()
          )}
        </div>

        {/* Disclaimer */}
        <p className="mt-12 text-xs text-ink-muted">
          VitaPath provides general dietary guidance, not medical advice. Talk
          to a clinician before starting, stopping, or combining any
          supplement.
        </p>
      </Container>

      {/* Bottom actions — sticky bar on mobile, inline footer on md+. */}
      <div
        className={[
          "fixed inset-x-0 bottom-0 z-20 border-t border-sage-soft/60 bg-bg/95 px-6 py-3 backdrop-blur",
          "md:relative md:inset-x-auto md:mt-0 md:border-t-0 md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-none",
        ].join(" ")}
      >
        <Container className="flex flex-wrap items-center justify-center gap-3 md:justify-start md:py-4">
          {mode === "shared" ? (
            <>
              <Link href="/" className={buttonClasses("ghost", "md")}>
                About VitaPath
              </Link>
              <Link
                href="/quiz/1"
                className={buttonClasses("primary", "md")}
              >
                Get your own
              </Link>
            </>
          ) : (
            <>
              <BackButton href="/">Back to home</BackButton>
              <Link
                href="/quiz/1"
                className={buttonClasses("ghost", "md")}
              >
                Re-take the quiz
              </Link>
              <Link
                href="/history"
                className={buttonClasses("ghost", "md")}
              >
                View history
              </Link>
              <ShareButton quizId={results.quiz_id} />
            </>
          )}
        </Container>
      </div>
    </main>
  );
}
