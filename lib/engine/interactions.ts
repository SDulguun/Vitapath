// Safety / interaction checker. Pure function: (answers, recs) → filtered
// recs + warnings. Three categories of warnings, applied in this order:
//
//   1. Pregnancy removal — defensive re-gating: any rec without
//      pregnancy_safe=true is dropped if the user is pregnant.
//   2. Condition contraindications (from contraindications.json) — `remove`
//      drops the rec; `warn` keeps it. Pregnancy is treated specially so
//      contraindications keyed on condition="pregnancy" still fire even
//      though pregnancy isn't in answers.conditions.
//   3. Drug-supplement and supplement-supplement interactions (from
//      interactions.json) — the medication name appears verbatim in the
//      warning message (per nutrition-domain skill rule 4).
//
// Warnings are sorted by severity desc, then by id ascending for stability.

import type { QuizAnswers } from "@/lib/quiz/schemas";
import type { Recommendation } from "./types";
import type { Severity } from "./schemas";
import { CONTRAINDICATIONS, INTERACTIONS } from "./data";

export type WarningKind =
  | "pregnancy_removed"
  | "condition_removed"
  | "condition_warning"
  | "drug_interaction"
  | "supplement_interaction";

export type Warning = {
  id: string;
  severity: Severity;
  kind: WarningKind;
  message: string;
  supplement_slug?: string;
  medication?: string;
};

export type SafetyCheckResult = {
  recommendations: Recommendation[];
  warnings: Warning[];
};

const SEVERITY_RANK: Record<Severity, number> = { high: 3, moderate: 2, low: 1 };

export function checkInteractions(
  answers: QuizAnswers,
  recommendations: Recommendation[],
): SafetyCheckResult {
  const warnings: Warning[] = [];
  const finalRecs: Recommendation[] = [];

  const isPregnant = answers.pregnancy_status === "yes";
  const userMeds = new Set(
    answers.medications.filter((m): m is Exclude<typeof m, "none"> => m !== "none"),
  );
  const userConditions = new Set(
    answers.conditions.filter((c): c is Exclude<typeof c, "none"> => c !== "none"),
  );

  for (const rec of recommendations) {
    let dropped = false;

    // 1. Pregnancy gate (defensive — Goal 7 also gates, but the checker is
    //    callable on synthetic rec arrays in tests too).
    if (isPregnant && !rec.pregnancy_safe) {
      warnings.push({
        id: `preg_remove_${rec.supplement_slug}`,
        severity: "high",
        kind: "pregnancy_removed",
        message: `${rec.name} was removed: not recommended during pregnancy.`,
        supplement_slug: rec.supplement_slug,
      });
      dropped = true;
    }

    // 2. Condition contraindications
    if (!dropped) {
      for (const c of CONTRAINDICATIONS) {
        if (c.supplement_slug !== rec.supplement_slug) continue;
        const matches =
          c.condition === "pregnancy"
            ? isPregnant
            : userConditions.has(c.condition as never);
        if (!matches) continue;

        if (c.action === "remove") {
          warnings.push({
            id: `cond_remove_${rec.supplement_slug}_${c.condition}`,
            severity: "high",
            kind: "condition_removed",
            message: `${rec.name} was removed: ${c.message}`,
            supplement_slug: rec.supplement_slug,
          });
          dropped = true;
          break; // no point checking more contraindications for a dropped rec
        }
        warnings.push({
          id: `cond_warn_${rec.supplement_slug}_${c.condition}`,
          severity: "moderate",
          kind: "condition_warning",
          message: `${rec.name}: ${c.message}`,
          supplement_slug: rec.supplement_slug,
        });
      }
    }

    if (!dropped) finalRecs.push(rec);
  }

  // 3a. Drug-supplement interactions
  for (const rec of finalRecs) {
    for (const inter of INTERACTIONS) {
      let med: string | null = null;
      if (inter.a === rec.supplement_slug && userMeds.has(inter.b as never)) {
        med = inter.b;
      } else if (
        inter.b === rec.supplement_slug &&
        userMeds.has(inter.a as never)
      ) {
        med = inter.a;
      }
      if (!med) continue;
      warnings.push({
        id: `drug_${rec.supplement_slug}_${med}`,
        severity: inter.severity,
        kind: "drug_interaction",
        // Medication name appears verbatim — skill rule 4.
        message: `${rec.name} interacts with ${med}: ${inter.summary}`,
        supplement_slug: rec.supplement_slug,
        medication: med,
      });
    }
  }

  // 3b. Supplement-supplement interactions (between any two surviving recs)
  for (let i = 0; i < finalRecs.length; i++) {
    for (let j = i + 1; j < finalRecs.length; j++) {
      const slugA = finalRecs[i].supplement_slug;
      const slugB = finalRecs[j].supplement_slug;
      const inter = INTERACTIONS.find(
        (x) =>
          (x.a === slugA && x.b === slugB) || (x.a === slugB && x.b === slugA),
      );
      if (!inter) continue;
      const sortedSlugs = [slugA, slugB].sort();
      warnings.push({
        id: `supp_${sortedSlugs.join("_")}`,
        severity: inter.severity,
        kind: "supplement_interaction",
        message: `${finalRecs[i].name} + ${finalRecs[j].name}: ${inter.summary}`,
        supplement_slug: slugA,
      });
    }
  }

  // Sort: severity desc, then id asc for stable ordering.
  warnings.sort((a, b) => {
    const d = SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity];
    return d !== 0 ? d : a.id.localeCompare(b.id);
  });

  return { recommendations: finalRecs, warnings };
}
