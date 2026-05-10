import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from "react";
import { cx } from "./_cx";

const inputBase =
  "block w-full rounded-md border border-sage-soft bg-surface px-4 py-3 " +
  "text-base text-ink placeholder:text-ink-muted/70 " +
  "transition-colors duration-fast ease-out-soft " +
  "focus:outline-2 focus:outline-offset-2 focus:outline-sage focus:border-sage " +
  "disabled:opacity-50 disabled:bg-surface-soft";

/** Label + input + helper-text wrapper. Use with <TextInput> or <Select> as
 *  children. The label/htmlFor pairing is mandatory for accessibility. */
export function Field({
  label,
  htmlFor,
  helper,
  error,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  helper?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const helperId = helper ? `${htmlFor}-help` : undefined;
  const errorId = error ? `${htmlFor}-err` : undefined;
  return (
    <div className={cx("flex flex-col gap-2", className)}>
      <label
        htmlFor={htmlFor}
        className="text-sm font-medium text-ink"
      >
        {label}
      </label>
      {children}
      {helper && !error && (
        <p id={helperId} className="text-xs text-ink-muted">
          {helper}
        </p>
      )}
      {error && (
        <p
          id={errorId}
          role="alert"
          className="text-xs font-medium text-rose"
        >
          {error}
        </p>
      )}
    </div>
  );
}

/** Pre-styled <input> for use inside <Field>. Apply `id` matching Field's
 *  htmlFor. Type defaults to "text". */
export function TextInput({
  className,
  type,
  ...rest
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type={type ?? "text"}
      className={cx(inputBase, className)}
      {...rest}
    />
  );
}

/** Pre-styled <select> with a custom sage chevron via background-image. */
export function Select({
  className,
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cx(
        inputBase,
        // Custom chevron: SVG-data-URI in --color-sage, no native arrow.
        "appearance-none bg-no-repeat pr-12",
        "bg-[length:1.25rem_1.25rem] bg-[position:right_1rem_center]",
        // Encoded SVG: chevron-down, stroke #6F8F7A, 1.5 width.
        "bg-[url('data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20stroke%3D%22%236F8F7A%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20viewBox%3D%220%200%2024%2024%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')]",
        className,
      )}
      {...rest}
    >
      {children}
    </select>
  );
}
