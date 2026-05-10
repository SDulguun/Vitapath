import { cx } from "./_cx";

/** Animated sage-on-cream progress bar with optional "Step X of Y / N%"
 *  caption above. Width transition is medium-duration with ease-out-soft. */
export function ProgressBar({
  value,
  max = 100,
  showCaption = false,
  captionLeft,
  captionRight,
  className,
  ariaLabel,
}: {
  /** Current value, 0..max. Clamped at render time. */
  value: number;
  max?: number;
  showCaption?: boolean;
  captionLeft?: string;
  captionRight?: string;
  className?: string;
  ariaLabel?: string;
}) {
  const clamped = Math.max(0, Math.min(max, value));
  const pct = max === 0 ? 0 : Math.round((clamped / max) * 100);
  const label =
    ariaLabel ?? (captionLeft ? `${captionLeft} (${pct}%)` : `${pct}%`);

  return (
    <div className={className}>
      {showCaption && (
        <div className="mb-2 flex items-baseline justify-between text-xs text-ink-muted">
          <span>{captionLeft}</span>
          <span>{captionRight ?? `${pct}%`}</span>
        </div>
      )}
      <div
        className="h-1.5 w-full overflow-hidden rounded-pill bg-surface-soft"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
      >
        <div
          className={cx(
            "h-full rounded-pill bg-sage",
            "transition-[width] duration-med ease-out-soft",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
