"use client";

import { useState, useTransition } from "react";
import { ChevronDownIcon, SparkleIcon, Spinner } from "@/app/_components";
import {
  generateExplanation,
  type ExplanationResult,
} from "@/lib/explain/actions";

/** Inline "Why this for me?" expander on a single RecCard. The first
 *  click triggers the server action; subsequent opens reuse the local
 *  result. Server-side cache (rec_explanations table) makes repeat
 *  page visits free even across sessions. */
export function RecCardExplain({
  quizId,
  supplementSlug,
}: {
  quizId: string;
  supplementSlug: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<ExplanationResult | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && !state) {
      startTransition(async () => {
        const result = await generateExplanation({
          quizId,
          supplementSlug,
        });
        setState(result);
      });
    }
  }

  return (
    <div className="mt-5 border-t border-sage-soft/60 pt-4">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={`explain-${supplementSlug}`}
        data-testid={`explain-toggle-${supplementSlug}`}
        className="flex w-full items-center justify-between gap-2 rounded-sm text-left text-sm font-medium text-sage-deep transition-colors duration-fast hover:text-sage focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage"
      >
        <span className="flex items-center gap-2">
          <SparkleIcon className="size-4" aria-hidden />
          {open ? "Hide explanation" : "Why this for me?"}
        </span>
        <ChevronDownIcon
          className={`size-4 transition-transform duration-fast ease-out-soft ${
            open ? "rotate-180" : ""
          } motion-reduce:transition-none`}
          aria-hidden
        />
      </button>

      {open && (
        <div
          id={`explain-${supplementSlug}`}
          data-testid={`explain-body-${supplementSlug}`}
          className="vp-fade-in mt-3 rounded-md bg-surface-sage/40 px-4 py-3 text-sm leading-relaxed text-ink-soft"
        >
          {pending && (
            <div className="flex items-center gap-2 text-ink-muted">
              <Spinner className="size-4" />
              <span>Generating explanation.</span>
            </div>
          )}
          {!pending && state?.ok && <p>{state.text}</p>}
          {!pending && state && !state.ok && (
            <p className="text-rose">{state.error}</p>
          )}
        </div>
      )}
    </div>
  );
}
