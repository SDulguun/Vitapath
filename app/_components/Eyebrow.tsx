import type { ReactNode } from "react";
import { cx } from "./_cx";

/** Tiny uppercase caption above a heading: "VITAPATH", "ABOUT YOU", etc. */
export function Eyebrow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cx(
        "text-xs font-medium uppercase tracking-[0.2em] text-ink-muted",
        className,
      )}
    >
      {children}
    </p>
  );
}
