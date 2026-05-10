import { cx } from "./_cx";
import { ProgressBar } from "./ProgressBar";

/** Quiz step indicator: progress bar + N dots that fill as steps complete +
 *  current step name underneath. Subtle, never garish. */
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

  return (
    <div className={className}>
      <ProgressBar
        value={safeCurrent}
        max={totalSteps}
        showCaption
        captionLeft={`Step ${safeCurrent} of ${totalSteps}`}
      />

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
