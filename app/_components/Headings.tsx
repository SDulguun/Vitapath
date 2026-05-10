import type { ReactNode } from "react";
import { cx } from "./_cx";

/** Display H1. Optional subtitle renders muted directly below. */
export function PageHeading({
  children,
  subtitle,
  className,
}: {
  children: ReactNode;
  subtitle?: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <h1 className="font-serif text-4xl leading-[1.1] text-ink sm:text-5xl md:text-6xl">
        {children}
      </h1>
      {subtitle && (
        <p className="mt-3 text-base text-ink-soft sm:text-lg">{subtitle}</p>
      )}
    </div>
  );
}

/** Section H2 in the editorial serif. */
export function SectionHeading({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={cx(
        "font-serif text-2xl leading-tight text-ink sm:text-3xl",
        className,
      )}
    >
      {children}
    </h2>
  );
}
