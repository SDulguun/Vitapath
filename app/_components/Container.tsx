import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { cx } from "./_cx";

type ContainerProps<T extends ElementType = "div"> = {
  as?: T;
  children: ReactNode;
} & Omit<HTMLAttributes<HTMLElement>, "children">;

/** Standard page width: max-w-3xl, generous side padding. Wrap every page. */
export function Container<T extends ElementType = "div">({
  as,
  children,
  className,
  ...rest
}: ContainerProps<T>) {
  const Tag = (as ?? "div") as ElementType;
  return (
    <Tag className={cx("mx-auto w-full max-w-3xl px-6", className)} {...rest}>
      {children}
    </Tag>
  );
}
