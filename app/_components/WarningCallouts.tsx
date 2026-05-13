import type { Severity } from "@/lib/engine/schemas";
import type { Warning } from "@/lib/engine/interactions";
import { Card, type CardTone } from "./Card";
import { Disclosure } from "./Disclosure";
import {
  AlertCircleIcon,
  AlertTriangleIcon,
  InfoCircleIcon,
} from "./icons";
import { cx } from "./_cx";

const SEVERITY_RANK: Record<Severity, number> = { high: 3, moderate: 2, low: 1 };

const TONE_BY_SEVERITY: Record<Severity, CardTone> = {
  high: "critical",
  moderate: "warning",
  low: "caution",
};

const ICON_BY_SEVERITY = {
  high: AlertTriangleIcon,
  moderate: AlertCircleIcon,
  low: InfoCircleIcon,
} as const;

const ICON_TONE_BY_SEVERITY: Record<Severity, string> = {
  high: "text-rose",
  moderate: "text-terracotta",
  low: "text-amber",
};

function titleFor(w: Warning): string {
  switch (w.kind) {
    case "pregnancy_removed":
      return "Removed for pregnancy";
    case "condition_removed":
      return "Removed for your condition";
    case "condition_warning":
      return "Use with caution";
    case "drug_interaction":
      return `Possible interaction with ${w.medication ?? "your medication"}`;
    case "supplement_interaction":
      return "These two supplements interact";
  }
}

function WarningRow({
  warning,
  resolveName,
}: {
  warning: Warning;
  resolveName?: (slug: string) => string | undefined;
}) {
  const Icon = ICON_BY_SEVERITY[warning.severity];
  const isRemoval =
    warning.kind === "pregnancy_removed" ||
    warning.kind === "condition_removed";
  const removedName =
    isRemoval && warning.supplement_slug && resolveName
      ? resolveName(warning.supplement_slug)
      : undefined;

  return (
    <Card
      tone={TONE_BY_SEVERITY[warning.severity]}
      compact
      data-testid={`warning-${warning.kind}`}
      className="flex items-start gap-3"
    >
      <Icon
        className={cx(
          "mt-0.5 size-5 shrink-0",
          ICON_TONE_BY_SEVERITY[warning.severity],
        )}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-ink">{titleFor(warning)}</p>
        <p className="mt-1 text-sm text-ink-soft">{warning.message}</p>
        {removedName && (
          <p className="mt-2">
            <span
              data-testid={`warning-removed-chip-${warning.supplement_slug}`}
              className="inline-flex items-center gap-1 rounded-pill bg-surface/60 px-2.5 py-0.5 text-xs text-ink-muted line-through"
            >
              {removedName}
            </span>
          </p>
        )}
      </div>
    </Card>
  );
}

/** Severity-grouped, icon-fronted warning callouts. High/moderate render
 *  first and inline; if there are 3+ low-severity items they collapse into
 *  a Disclosure to keep the page calm. Pass `resolveSupplementName` to
 *  show the struck-through chip on removal warnings. */
export function WarningCallouts({
  warnings,
  resolveSupplementName,
  className,
}: {
  warnings: Warning[];
  resolveSupplementName?: (slug: string) => string | undefined;
  className?: string;
}) {
  if (warnings.length === 0) return null;

  // Defensive re-sort: severity desc, id asc on ties.
  const sorted = [...warnings].sort((a, b) => {
    const d = SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity];
    return d !== 0 ? d : a.id.localeCompare(b.id);
  });

  const topSeverity = sorted.filter((w) => w.severity !== "low");
  const lowSeverity = sorted.filter((w) => w.severity === "low");
  const collapseLow = lowSeverity.length >= 3;

  return (
    <section
      data-testid="warnings-section"
      className={cx("space-y-3", className)}
      aria-label="Safety heads-up"
    >
      <h2 className="text-xs uppercase tracking-[0.2em] text-ink-muted">
        Heads-up
      </h2>

      {topSeverity.map((w) => (
        <WarningRow
          key={w.id}
          warning={w}
          resolveName={resolveSupplementName}
        />
      ))}

      {!collapseLow &&
        lowSeverity.map((w) => (
          <WarningRow
            key={w.id}
            warning={w}
            resolveName={resolveSupplementName}
          />
        ))}

      {collapseLow && (
        <Disclosure
          data-testid="warnings-low-disclosure"
          summary={
            <span className="text-sm">
              Show {lowSeverity.length} less critical heads-up
              {lowSeverity.length === 1 ? "" : "s"}
            </span>
          }
        >
          <div className="space-y-3">
            {lowSeverity.map((w) => (
              <WarningRow
                key={w.id}
                warning={w}
                resolveName={resolveSupplementName}
              />
            ))}
          </div>
        </Disclosure>
      )}
    </section>
  );
}
