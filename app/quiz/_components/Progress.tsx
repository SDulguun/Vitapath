import { TOTAL_STEPS } from "@/lib/quiz/schemas";

export function Progress({ step }: { step: number }) {
  const pct = Math.round((step / TOTAL_STEPS) * 100);
  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between text-xs text-stone-500">
        <span data-testid="progress-step">
          Step {step} of {TOTAL_STEPS}
        </span>
        <span>{pct}%</span>
      </div>
      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-stone-200">
        <div
          className="h-full bg-stone-900 transition-all"
          style={{ width: `${pct}%` }}
          aria-hidden
        />
      </div>
    </div>
  );
}
