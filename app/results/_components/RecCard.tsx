"use client";

import { useState } from "react";
import type { Brand } from "@/lib/engine/schemas";
import type { ResultsRecommendation } from "@/lib/results/data";

const usd = (n: number) => `$${n.toFixed(2)}`;

export function RecCard({
  rec,
  primary,
  alternative,
}: {
  rec: ResultsRecommendation;
  primary: Brand;
  alternative: Brand | null;
}) {
  const [showAlt, setShowAlt] = useState(false);
  const active = showAlt && alternative ? alternative : primary;
  const savings = alternative
    ? primary.price_usd_per_month - alternative.price_usd_per_month
    : 0;

  return (
    <li
      data-testid={`rec-${rec.supplement_slug}`}
      className="rounded-3xl border border-stone-200 bg-white p-6"
    >
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="text-lg font-medium">{rec.name}</h3>
        <p className="text-sm text-stone-500">{rec.dose}</p>
      </div>

      {/* Brand row */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
        <div>
          <p
            className="text-sm font-medium text-stone-900"
            data-testid={`brand-name-${rec.supplement_slug}`}
          >
            {active.name}
          </p>
          <p
            className="text-xs text-stone-600"
            data-testid={`brand-price-${rec.supplement_slug}`}
          >
            {usd(active.price_usd_per_month)} / month
          </p>
        </div>
        {alternative && (
          <button
            type="button"
            onClick={() => setShowAlt((s) => !s)}
            data-testid={`toggle-alt-${rec.supplement_slug}`}
            className="rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 transition hover:border-stone-500"
          >
            {showAlt
              ? "Switch back to recommended"
              : `See cheaper alternative (save ${usd(savings)}/mo)`}
          </button>
        )}
      </div>

      {/* Rationale */}
      <ul className="mt-3 space-y-1 text-sm text-stone-700">
        {rec.rationale.map((rr) => (
          <li key={rr.rule_id}>• {rr.reason}</li>
        ))}
      </ul>

      {/* Evidence */}
      {rec.evidence.length > 0 && (
        <div
          data-testid={`evidence-${rec.supplement_slug}`}
          className="mt-4 border-t border-stone-200 pt-4"
        >
          <p className="text-xs uppercase tracking-wider text-stone-500">
            Evidence
          </p>
          <ul className="mt-2 space-y-2">
            {rec.evidence.map((s, i) => (
              <li
                key={`${rec.supplement_slug}-${i}`}
                className="text-xs text-stone-600"
              >
                <span className="font-medium text-stone-800">{s.title}</span>{" "}
                <span className="tabular-nums">({s.year})</span>
                {s.doi && (
                  <>
                    {" "}
                    <span className="text-stone-400">·</span>{" "}
                    <a
                      href={`https://doi.org/${s.doi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline-offset-4 hover:underline"
                    >
                      doi:{s.doi}
                    </a>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </li>
  );
}
