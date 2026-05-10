// Tiny class-name composer — avoids the clsx / tailwind-merge dependency.
// Pass any number of strings; falsy values are dropped.
export function cx(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(" ");
}
