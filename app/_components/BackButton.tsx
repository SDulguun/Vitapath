import Link from "next/link";
import type { MouseEventHandler, ReactNode } from "react";
import { buttonClasses } from "./Button";
import { ChevronLeftIcon } from "./icons";
import { cx } from "./_cx";

type Common = {
  /** Override the "Back" label (e.g. "Back to home"). */
  children?: ReactNode;
  className?: string;
  /** Visual size of the underlying Button. Defaults to "md". */
  size?: "md" | "lg";
  /** Test selector hook — forwarded to the rendered element. */
  "data-testid"?: string;
};

type AsLink = Common & {
  href: string;
  onClick?: never;
};

type AsButton = Common & {
  href?: never;
  onClick: MouseEventHandler<HTMLButtonElement>;
};

/** Ghost-styled back affordance with a ChevronLeft icon that slides 2px
 *  left on hover. Never use the literal `←` character — that's v2 §2.4's
 *  one-line ban; this component is the canonical replacement.
 *
 *  Renders <Link> when `href` is passed, <button onClick> otherwise. The
 *  signatures are mutually exclusive at the type level so you can't
 *  accidentally pass both. */
export function BackButton(props: AsLink | AsButton) {
  const {
    children = "Back",
    className,
    size = "md",
    "data-testid": testId,
  } = props;
  const classes = cx(
    buttonClasses("ghost", size),
    "group gap-1.5",
    className,
  );
  const inner = (
    <>
      <ChevronLeftIcon
        className="size-4 transition-transform duration-fast ease-out-soft group-hover:-translate-x-0.5"
        aria-hidden
      />
      <span>{children}</span>
    </>
  );

  if ("href" in props && props.href) {
    return (
      <Link href={props.href} className={classes} data-testid={testId}>
        {inner}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={(props as AsButton).onClick}
      className={classes}
      data-testid={testId}
    >
      {inner}
    </button>
  );
}
