"use client";

import { Button, EvidenceList, SprigIcon } from "@/app/_components";
import type { Brand } from "@/lib/engine/schemas";
import type { ResultsRecommendation } from "@/lib/results/data";

const usd = (n: number) => `$${n.toFixed(2)}`;

// Quick rule_id → human tag mapping for the optional relevance chips at
// the card's top-right. Add new rules to RULE_TAG when they're added to
// lib/engine/rules.ts. Missing entries are simply omitted — the chip row
// disappears if no rule produced a tag.
const RULE_TAG: Record<string, string> = {
  R001_LOW_SUN_VITAMIN_D: "low sun",
  R002_VEGAN_B12: "vegan",
  R003_HIGH_STRESS_MAGNESIUM: "high stress",
  R004_POOR_SLEEP_MAGNESIUM: "poor sleep",
  R005_LOW_FISH_OMEGA3: "low fish",
  R006_PREMENOPAUSAL_FEMALE_IRON: "premenopausal",
  R007_PREGNANCY_FOLATE: "pregnancy",
  R008_LOW_DAIRY_VITAMIN_D: "low dairy",
  R009_PREGNANCY_OMEGA3: "pregnancy",
  R010_PREGNANCY_IRON: "pregnancy",
};

function relevanceTags(ruleIds: ReadonlyArray<string>): string[] {
  const tags = new Set<string>();
  for (const id of ruleIds) {
    const t = RULE_TAG[id];
    if (t) tags.add(t);
  }
  return Array.from(tags);
}

/** Controlled recommendation card. State (showAlternative) is hoisted into
 *  <ResultsInteractive> so the BudgetBar bulk toggle and per-row toggles
 *  cooperate. Stable testids: rec-{slug}, brand-name-{slug},
 *  brand-price-{slug}, toggle-alt-{slug}, evidence-{slug}. */
export function RecCard({
  rec,
  primary,
  alternative,
  showAlternative,
  onToggleAlternative,
}: {
  rec: ResultsRecommendation;
  primary: Brand;
  alternative: Brand | null;
  showAlternative: boolean;
  onToggleAlternative: () => void;
}) {
  const active = showAlternative && alternative ? alternative : primary;
  const savings = alternative
    ? primary.price_usd_per_month - alternative.price_usd_per_month
    : 0;
  const tags = relevanceTags(rec.rule_ids);

  return (
    <li
      data-testid={`rec-${rec.supplement_slug}`}
      className="rounded-lg border border-sage-soft/60 bg-surface p-6 shadow-sm transition-all duration-fast ease-out-soft hover:-translate-y-0.5 hover:border-sage/60 hover:shadow-md motion-reduce:transform-none motion-reduce:transition-none"
    >
      {/* Header */}
      <div className="flex items-baseline justify-between gap-4">
        <div className="flex items-baseline gap-2.5">
          <SprigIcon
            aria-hidden
            className="size-4 shrink-0 translate-y-1 text-sage/70"
          />
          <h3 className="font-serif text-2xl leading-tight text-ink">
            {rec.name}
          </h3>
        </div>
        <p className="shrink-0 text-sm text-ink-soft">{rec.dose}</p>
      </div>

      {tags.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Why this was recommended">
          {tags.map((t) => (
            <li
              key={t}
              className="rounded-pill bg-sage-soft px-2.5 py-0.5 text-xs font-medium text-sage-deep"
            >
              {t}
            </li>
          ))}
        </ul>
      )}

      {/* Why — sage-bullet rationale */}
      <ul className="mt-4 space-y-2 text-sm text-ink-soft">
        {rec.rationale.map((rr) => (
          <li key={rr.rule_id} className="flex gap-3">
            <span
              aria-hidden
              className="mt-2 inline-block size-1.5 shrink-0 rounded-pill bg-sage"
            />
            <span>{rr.reason}</span>
          </li>
        ))}
      </ul>

      {/* Brand pick — sunken block */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-md bg-surface-soft px-4 py-3">
        <div>
          <p
            className="text-sm font-medium text-ink"
            data-testid={`brand-name-${rec.supplement_slug}`}
          >
            {active.name}
          </p>
          <p
            className="text-xs text-ink-soft tabular-nums"
            data-testid={`brand-price-${rec.supplement_slug}`}
          >
            {usd(active.price_usd_per_month)} / month
          </p>
        </div>
        {alternative && (
          <Button
            variant="secondary"
            size="md"
            onClick={onToggleAlternative}
            data-testid={`toggle-alt-${rec.supplement_slug}`}
            className="text-xs"
          >
            {showAlternative
              ? "Show original"
              : `See cheaper alternative (save ${usd(savings)}/mo)`}
          </Button>
        )}
      </div>

      {/* Evidence */}
      {rec.evidence.length > 0 && (
        <div
          data-testid={`evidence-${rec.supplement_slug}`}
          className="mt-5 border-t border-sage-soft/60 pt-4"
        >
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-ink-muted">
            Evidence
          </p>
          <EvidenceList studies={rec.evidence} />
        </div>
      )}
    </li>
  );
}
