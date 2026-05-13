import type { SVGProps } from "react";
import { cx } from "./_cx";

/** Small rotating-ring spinner for async button labels and pending states.
 *  Sage stroke by default, but inherits `currentColor` so callers can tint
 *  it with `text-*` utilities. Sized at 1.25rem (20px) by default per v2
 *  §1.2; pass `className="size-N"` to override.
 *
 *  Animation uses Tailwind's `animate-spin`, which the global reduced-motion
 *  damp collapses to ~0ms — for reduced-motion users the ring stays still
 *  (still a useful visual cue alongside the disabled button state). */
export function Spinner({
  className,
  ...rest
}: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      className={cx("size-5 animate-spin text-sage", className)}
      aria-hidden
      {...rest}
    >
      <circle cx={12} cy={12} r={9} strokeOpacity={0.25} />
      <path d="M21 12a9 9 0 0 0-9-9" />
    </svg>
  );
}
