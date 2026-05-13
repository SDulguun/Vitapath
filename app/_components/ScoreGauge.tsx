import type { CSSProperties } from "react";
import { Disclosure } from "./Disclosure";
import { cx } from "./_cx";

export type ScoreContribution = {
  rule_id: string;
  label: string;
  delta: number;
};

// Geometry for the semi-circular arc. viewBox 0 0 200 120 with the chord at
// y=100 and a radius of 86 gives the arc enough vertical room for a
// stroke-width of 14 plus space below the chord for the numeral.
const RADIUS = 86;
const TRACK_LENGTH = Math.PI * RADIUS; // ≈ 270.18

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

/** Animated half-moon score gauge. Server component — the fill arc
 *  animates via a pure CSS keyframe (defined in app/globals.css) whose
 *  end-state is driven by an inline --target-offset CSS variable. Reduced
 *  motion is handled by the global safety net which collapses the
 *  duration to 0.01ms; `animation-fill-mode: forwards` makes that a
 *  visually identical snap to the target. */
export function ScoreGauge({
  score,
  baseline,
  contributions,
  className,
}: {
  score: number;
  baseline: number;
  contributions: ScoreContribution[];
  className?: string;
}) {
  const safeScore = clamp(score, 0, 100);
  const targetOffset = TRACK_LENGTH * (1 - safeScore / 100);
  const arcStyle = {
    "--track-length": String(TRACK_LENGTH),
    "--target-offset": String(targetOffset),
  } as CSSProperties;

  return (
    <section
      data-testid="score-section"
      className={cx(
        "rounded-lg border border-sage-soft/60 bg-surface p-6 shadow-sm sm:p-8",
        className,
      )}
      aria-label={`Health score ${safeScore} out of 100`}
    >
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-medium text-ink-soft">Health score</p>
        <p className="text-xs text-ink-muted">baseline {baseline}</p>
      </div>

      {/* Gauge + number */}
      <div className="relative mx-auto mt-3 aspect-[200/120] w-full max-w-sm">
        <svg
          aria-hidden
          viewBox="0 0 200 120"
          preserveAspectRatio="xMidYMid meet"
          className="absolute inset-0 h-full w-full"
        >
          <defs>
            <linearGradient id="vp-score-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--color-sage)" />
              <stop offset="100%" stopColor="var(--color-sage-deep)" />
            </linearGradient>
          </defs>
          {/* Track */}
          <path
            d="M 14 100 A 86 86 0 0 1 186 100"
            fill="none"
            stroke="var(--color-sage-soft)"
            strokeWidth={14}
            strokeLinecap="round"
          />
          {/* Animated fill */}
          <path
            d="M 14 100 A 86 86 0 0 1 186 100"
            fill="none"
            stroke="url(#vp-score-grad)"
            strokeWidth={14}
            strokeLinecap="round"
            className="vp-score-fill"
            style={arcStyle}
          />
        </svg>
        {/* Numeric centered, baseline-aligned just inside the chord */}
        <div className="absolute inset-x-0 bottom-1 flex items-baseline justify-center gap-1.5">
          <span
            data-testid="score-value"
            className="font-serif text-7xl leading-none text-ink sm:text-8xl"
          >
            {safeScore}
          </span>
          <span className="text-base text-ink-muted">/100</span>
        </div>
      </div>

      {/* Contribution breakdown */}
      {contributions.length > 0 && (
        <div className="mt-6">
          <Disclosure
            data-testid="score-contributions"
            summary={
              <>
                What moved your score?{" "}
                <span className="text-ink-muted">({contributions.length})</span>
              </>
            }
          >
            <ul className="space-y-2">
              {contributions.map((c) => (
                <li
                  key={c.rule_id}
                  className="flex items-center justify-between gap-3 rounded-md bg-surface-soft px-4 py-2 text-sm"
                >
                  <span className="text-ink-soft">{c.label}</span>
                  <span
                    className={cx(
                      "shrink-0 font-medium tabular-nums",
                      c.delta > 0 ? "text-sage-deep" : "text-terracotta",
                    )}
                  >
                    {c.delta > 0 ? "+" : ""}
                    {c.delta} pts
                  </span>
                </li>
              ))}
            </ul>
          </Disclosure>
        </div>
      )}
    </section>
  );
}
