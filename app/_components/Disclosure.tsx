import type { DetailsHTMLAttributes, ReactNode } from "react";
import { cx } from "./_cx";
import { ChevronRightIcon } from "./icons";

type DisclosureProps = {
  summary: ReactNode;
  children: ReactNode;
  className?: string;
  defaultOpen?: boolean;
} & Omit<DetailsHTMLAttributes<HTMLDetailsElement>, "children" | "className" | "open">;

/** Server-side animated `<details>` replacement. Chevron rotates 90° via
 *  CSS when the native [open] attribute toggles — no client JS needed.
 *  Extra HTML attrs (id, data-testid, etc.) are forwarded to <details>. */
export function Disclosure({
  summary,
  children,
  className,
  defaultOpen = false,
  ...rest
}: DisclosureProps) {
  return (
    <details
      open={defaultOpen}
      className={cx("group [&>summary]:list-none", className)}
      {...rest}
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
