import type { ReactNode } from "react";
import { cx } from "./_cx";
import { ChevronRightIcon } from "./icons";

/** Server-side animated `<details>` replacement. Chevron rotates 90° via
 *  CSS when the native [open] attribute toggles — no client JS needed. */
export function Disclosure({
  summary,
  children,
  className,
  defaultOpen = false,
}: {
  summary: ReactNode;
  children: ReactNode;
  className?: string;
  defaultOpen?: boolean;
}) {
  return (
    <details
      open={defaultOpen}
      className={cx("group [&>summary]:list-none", className)}
    >
      <summary
        className={cx(
          "flex cursor-pointer items-center gap-2",
          "text-sm text-ink-soft transition-colors duration-fast",
          "hover:text-ink focus-visible:text-ink",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage",
          "rounded-sm",
        )}
      >
        <ChevronRightIcon
          className="size-4 text-ink-muted transition-transform duration-med ease-out-soft group-open:rotate-90"
          aria-hidden
        />
        {summary}
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  );
}
