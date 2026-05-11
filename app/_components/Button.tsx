import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "./_cx";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-pill " +
  "font-medium transition-all duration-fast ease-out-soft " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage " +
  "disabled:opacity-50 disabled:pointer-events-none " +
  "active:scale-[0.98]";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-sage text-white shadow-sm hover:bg-sage-deep hover:shadow-md " +
    "border border-sage-deep/0",
  secondary:
    "bg-surface text-ink border border-sage-soft hover:border-sage hover:shadow-sm",
  ghost:
    "bg-transparent text-ink-soft hover:text-ink hover:bg-surface-soft",
};

const sizes: Record<ButtonSize, string> = {
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3.5 text-base",
};

/** Shared class string for both <Button> (renders <button>) and any
 *  link-styled-as-button case (e.g. `<Link className={buttonClasses("primary","lg")}>`).
 *  Used instead of polymorphic-`as` to keep the Button API simple. */
export function buttonClasses(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string,
): string {
  return cx(base, variants[variant], sizes[size], className);
}

export type ButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
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
      className={buttonClasses(variant, size, className)}
      {...rest}
    >
      {children}
    </button>
  );
}
