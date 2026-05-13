import type { Study } from "@/lib/engine/schemas";
import { cx } from "./_cx";

/** Compact two-column evidence grid (single column on mobile). Each row
 *  shows the study title (linked when a DOI is present, with a soft sage
 *  underline that thickens on hover), year, and an optional `doi:` chip
 *  in --color-ink-muted. */
export function EvidenceList({
  studies,
  className,
  "data-testid": testId,
}: {
  studies: ReadonlyArray<Study>;
  className?: string;
  "data-testid"?: string;
}) {
  if (studies.length === 0) return null;
  return (
    <ul
      className={cx("grid gap-3 sm:grid-cols-2", className)}
      data-testid={testId}
    >
      {studies.map((s, i) => (
        <li key={`${s.title}-${i}`} className="text-xs leading-snug">
          {s.doi ? (
            <a
              href={`https://doi.org/${s.doi}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-sm font-medium text-ink underline decoration-sage decoration-1 underline-offset-4 transition-[text-decoration-thickness] duration-fast hover:decoration-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage"
            >
              {s.title}
            </a>
          ) : (
            <span className="font-medium text-ink">{s.title}</span>
          )}{" "}
          <span className="tabular-nums text-ink-muted">({s.year})</span>
          {s.doi && (
            <span className="ml-1 text-ink-muted">· doi:{s.doi}</span>
          )}
        </li>
      ))}
    </ul>
  );
}
