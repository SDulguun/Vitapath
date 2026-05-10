import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { cx } from "./_cx";

export type CardTone =
  | "default"
  | "sage"
  | "warning"
  | "caution"
  | "critical"
  | "evidence";

const tones: Record<CardTone, string> = {
  default:  "bg-surface border-sage-soft/60",
  sage:     "bg-surface-sage border-sage-soft",
  warning:  "bg-terracotta-soft border-terracotta/30",
  caution:  "bg-amber-soft border-amber/30",
  critical: "bg-rose-soft border-rose/30",
  evidence: "bg-evidence-soft border-evidence/30",
};

type CardProps<T extends ElementType = "div"> = {
  as?: T;
  tone?: CardTone;
  /** Tighten padding on dense rows; default `p-6`. */
  compact?: boolean;
  children: ReactNode;
} & Omit<HTMLAttributes<HTMLElement>, "children">;

export function Card<T extends ElementType = "div">({
  as,
  tone = "default",
  compact = false,
  className,
  children,
  ...rest
}: CardProps<T>) {
  const Tag = (as ?? "div") as ElementType;
  return (
    <Tag
      className={cx(
        "rounded-lg border shadow-sm",
        compact ? "p-5" : "p-6",
        tones[tone],
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}
