"use client";

// State container for the interactive bits of /results — the BudgetBar
// owns the slider + cheaper-picks toggle, RecCards report individual
// alternative toggles back up. The bulk + per-row toggles cooperate via a
// single `overrides` map keyed by supplement_slug.

import { useEffect, useState } from "react";
import { BudgetBar } from "@/app/_components";
import type { Brand } from "@/lib/engine/schemas";
import type { ResultsRecommendation } from "@/lib/results/data";
import { RecCard } from "./RecCard";

const BUDGET_KEY = "vitapath_budget_v1";
const DEFAULT_BUDGET = 50;
const MIN_BUDGET = 0;
const MAX_BUDGET = 200;

export type RecRow = {
  rec: ResultsRecommendation;
  primary: Brand;
  alternative: Brand | null;
};

export function ResultsInteractive({
  rows,
  initialBudget,
  quizId,
}: {
  rows: RecRow[];
  /** Server-resolved budget (e.g. from a ?budget=NN search param). The
   *  client also tries to read localStorage on mount and applies that
   *  value if it's a stricter user preference. */
  initialBudget?: number;
  /** Owner's quiz id. When provided, each RecCard renders the
   *  "Why this for me?" expander. Omitted on /r/[token] shared view. */
  quizId?: string;
}) {
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const [cheaperPicks, setCheaperPicks] = useState(false);
  const [budget, setBudget] = useState<number>(initialBudget ?? DEFAULT_BUDGET);

  // Apply persisted budget on mount. The setState-in-effect lint rule is
  // pragmatically silenced here for the same reason as the quiz store: we
  // need a client-only side-effect read with SSR-safe defaults.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(BUDGET_KEY);
      if (!raw) return;
      const n = Number(raw);
      if (!Number.isFinite(n) || n < MIN_BUDGET || n > MAX_BUDGET) return;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBudget(n);
    } catch {
      /* localStorage unavailable — fall back to initialBudget */
    }
  }, []);

  function changeBudget(n: number) {
    const clamped = Math.max(MIN_BUDGET, Math.min(MAX_BUDGET, n));
    setBudget(clamped);
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(BUDGET_KEY, String(clamped));
    } catch {
      /* ignore */
    }
  }

  /** Is the alternative currently shown for this slug? */
  function showAltFor(slug: string, hasAlternative: boolean): boolean {
    if (!hasAlternative) return false;
    if (slug in overrides) return overrides[slug];
    return cheaperPicks;
  }

  function toggleRow(slug: string, hasAlternative: boolean) {
    if (!hasAlternative) return;
    const next = !showAltFor(slug, true);
    setOverrides((prev) => ({ ...prev, [slug]: next }));
  }

  function changeCheaperPicks(on: boolean) {
    setCheaperPicks(on);
    // Wipe per-row overrides so the bulk toggle is the sole source of
    // truth right after flipping it. Users can still re-toggle individual
    // rows afterwards.
    setOverrides({});
  }

  const monthlyTotal = rows.reduce((sum, { rec, primary, alternative }) => {
    const useAlt = showAltFor(rec.supplement_slug, alternative !== null);
    const brand = useAlt && alternative ? alternative : primary;
    return sum + brand.price_usd_per_month;
  }, 0);

  return (
    <>
      <BudgetBar
        monthlyTotal={monthlyTotal}
        budget={budget}
        onBudgetChange={changeBudget}
        cheaperPicksEnabled={cheaperPicks}
        onCheaperPicksChange={changeCheaperPicks}
        className="mb-6"
      />
      <ul className="space-y-4" data-testid="rec-list">
        {rows.map(({ rec, primary, alternative }) => (
          <RecCard
            key={rec.supplement_slug}
            rec={rec}
            primary={primary}
            alternative={alternative}
            showAlternative={showAltFor(
              rec.supplement_slug,
              alternative !== null,
            )}
            onToggleAlternative={() =>
              toggleRow(rec.supplement_slug, alternative !== null)
            }
            quizId={quizId}
          />
        ))}
      </ul>
    </>
  );
}
