"use client";

import { Card } from "./Card";
import { cx } from "./_cx";

const usd = (n: number) => `$${n.toFixed(2)}`;

/** Sticky-feeling sage strip with live monthly total, budget slider, and a
 *  bulk "cheaper picks" toggle. Pure presentation — state is hoisted into
 *  the parent so individual RecCard toggles and this bulk toggle can
 *  cooperate. When monthlyTotal > budget the card flips to the warning
 *  tone and surfaces the gap. */
export function BudgetBar({
  monthlyTotal,
  budget,
  onBudgetChange,
  cheaperPicksEnabled,
  onCheaperPicksChange,
  className,
}: {
  monthlyTotal: number;
  budget: number;
  onBudgetChange: (n: number) => void;
  cheaperPicksEnabled: boolean;
  onCheaperPicksChange: (on: boolean) => void;
  className?: string;
}) {
  const overBudget = monthlyTotal > budget;
  const overBy = overBudget ? monthlyTotal - budget : 0;

  return (
    <Card
      tone={overBudget ? "warning" : "sage"}
      compact
      data-testid="budget-bar"
      className={cx(
        "flex flex-col gap-5 md:flex-row md:flex-wrap md:items-center md:justify-between",
        className,
      )}
    >
      <div className="md:flex-1">
        <p className="text-xs uppercase tracking-wider text-ink-muted">
          Monthly cost
        </p>
        <p
          className="mt-1 font-serif text-2xl font-medium text-ink tabular-nums"
          data-testid="budget-total"
        >
          {usd(monthlyTotal)}
          <span className="ml-1 text-sm font-normal text-ink-muted">/ mo</span>
        </p>
      </div>

      <div className="md:flex-1 md:max-w-xs">
        <div className="flex items-baseline justify-between text-xs text-ink-muted">
          <label htmlFor="budget-slider">Budget</label>
          <span className="tabular-nums" data-testid="budget-value">
            {usd(budget)}
          </span>
        </div>
        <input
          id="budget-slider"
          type="range"
          min={0}
          max={200}
          step={5}
          value={budget}
          onChange={(e) => onBudgetChange(Number(e.target.value))}
          data-testid="budget-slider"
          className="mt-1 block w-full accent-sage focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage"
          aria-label="Monthly supplement budget"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-ink-soft md:flex-none">
        <input
          type="checkbox"
          checked={cheaperPicksEnabled}
          onChange={(e) => onCheaperPicksChange(e.target.checked)}
          data-testid="cheaper-picks-toggle"
          className="h-4 w-4 rounded border-sage-soft accent-sage focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage"
        />
        Use cheaper picks where possible
      </label>

      {overBudget && (
        <p
          className="basis-full text-xs text-terracotta"
          data-testid="budget-over"
        >
          Over budget by {usd(overBy)}. Toggle &lsquo;cheaper picks&rsquo;{" "}
          to bring it under.
        </p>
      )}
    </Card>
  );
}
