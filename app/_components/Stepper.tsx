import { cx } from "./_cx";
import { ProgressBar } from "./ProgressBar";

/** Quiz step indicator: caption row + progress bar + N dots that fill as
 *  steps complete + optional step name underneath. Subtle, never garish.
 *
 *  The "Step X of N" span carries data-testid="progress-step" because that
 *  contract pre-dates the design refresh and is asserted by quiz.spec.ts.
 *  The matching "stepper-name" testid sits on the optional step name. */
export function Stepper({
  currentStep,
  totalSteps,
  stepName,
  className,
}: {
  currentStep: number;
  totalSteps: number;
  stepName?: string;
  className?: string;
}) {
  const safeCurrent = Math.max(1, Math.min(totalSteps, currentStep));
  const pct = totalSteps === 0 ? 0 : Math.round((safeCurrent / totalSteps) * 100);

  return (
    <div className={className}>
      <div className="mb-2 flex items-baseline justify-between text-xs text-ink-muted">
        <span data-testid="progress-step">
          Step {safeCurrent} of {totalSteps}
        </span>
        <span>{pct}%</span>
      </div>

      <ProgressBar value={safeCurrent} max={totalSteps} />

      <div className="mt-3 flex items-center justify-center gap-2">
        {Array.from({ length: totalSteps }, (_, i) => {
          const stepIndex = i + 1;
          const filled = stepIndex <= safeCurrent;
          return (
            <span
              key={stepIndex}
              aria-hidden
              className={cx(
                "block h-1.5 w-1.5 rounded-pill transition-colors duration-med ease-out-soft",
                filled ? "bg-sage" : "bg-sage-soft",
              )}
            />
          );
        })}
      </div>

      {stepName && (
        <p
          className="mt-2 text-center text-xs font-medium uppercase tracking-[0.18em] text-ink-muted"
          data-testid="stepper-name"
        >
          {stepName}
        </p>
      )}
    </div>
  );
}
