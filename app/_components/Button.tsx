import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "./_cx";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-pill " +
  "font-medium transition-all duration-fast ease-out-soft " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage " +
  "disabled:opacity-50 disabled:pointer-events-none " +
  "active:scale-[0.98]";

const variants: Record<Variant, string> = {
  primary:
    "bg-sage text-white shadow-sm hover:bg-sage-deep hover:shadow-md " +
    "border border-sage-deep/0",
  secondary:
    "bg-surface text-ink border border-sage-soft hover:border-sage hover:shadow-sm",
  ghost:
    "bg-transparent text-ink-soft hover:text-ink hover:bg-surface-soft",
};

const sizes: Record<Size, string> = {
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3.5 text-base",
};

export type ButtonProps = {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  type,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type ?? "button"}
      className={cx(base, variants[variant], sizes[size], className)}
      {...rest}
    >
      {children}
    </button>
  );
}
