// Pure recommendation engine. Given a typed QuizAnswers object, returns a
// deterministic, deduped list of Recommendations.
//
// Domain constraints (per the nutrition-domain skill):
//   - Pregnancy gates the supplement universe — items not flagged
//     pregnancy_safe are excluded entirely.
//   - Synergies (e.g. D + K2, Mg + B6) live in the rationale of the primary
//     recommendation — never as a separate rec.
//   - Drug-interaction handling is the interaction checker's job (goal 9),
//     not the rules engine.

import type { QuizAnswers } from "@/lib/quiz/schemas";
import type { Recommendation, Rule } from "./types";
import { getSupplement } from "./data";

export const RULES: ReadonlyArray<Rule> = [
  {
    id: "R001_LOW_SUN_VITAMIN_D",
    description: "Minimal sun exposure → vitamin D",
    supplement_slug: "vitamin_d",
    test: (a) => a.sun_exposure === "minimal",
    rationale: () =>
      "Minimal sun exposure limits skin synthesis of vitamin D; supplementation reliably raises serum 25(OH)D.",
  },
  {
    id: "R002_VEGAN_B12",
    description: "Vegan diet → vitamin B12",
    supplement_slug: "vitamin_b12",
    test: (a) => a.dietary_pattern === "vegan",
    rationale: () =>
      "Vitamin B12 is found almost exclusively in animal foods — vegan diets routinely require supplementation.",
  },
  {
    id: "R003_HIGH_STRESS_MAGNESIUM",
    description: "High stress (≥4/5) → magnesium glycinate",
    supplement_slug: "magnesium_glycinate",
    test: (a) => a.stress_level >= 4,
    rationale: (a) =>
      `Self-reported stress of ${a.stress_level}/5 — magnesium glycinate has modest evidence for stress regulation.`,
  },
  {
    id: "R004_POOR_SLEEP_MAGNESIUM",
    description: "Short or poor sleep → magnesium glycinate",
    supplement_slug: "magnesium_glycinate",
    test: (a) =>
      a.sleep_hours < 6 ||
      a.sleep_quality <= 2 ||
      a.trouble_falling_asleep === "often",
    rationale: () =>
      "Sleep duration / quality is below the typical range — magnesium glycinate may aid sleep onset.",
  },
  {
    id: "R005_LOW_FISH_OMEGA3",
    description: "Rare fish intake → omega-3 (EPA/DHA)",
    supplement_slug: "omega_3",
    test: (a) =>
      a.fish_per_week === "never" &&
      a.dietary_pattern !== "pescatarian", // pescatarian without fish is contradictory; treat conservatively
    rationale: () =>
      "Without regular fish intake, EPA/DHA levels often fall short of cardiovascular and brain-health targets.",
  },
  {
    id: "R006_PREMENOPAUSAL_FEMALE_IRON",
    description:
      "Premenopausal female (19–50), not pregnant → iron consideration",
    supplement_slug: "iron",
    test: (a) =>
      a.sex_at_birth === "female" &&
      (a.age_band === "19-30" || a.age_band === "31-50") &&
      a.pregnancy_status !== "yes",
    rationale: () =>
      "Menstrual iron losses raise iron needs in this group; consider iron if dietary intake is marginal.",
  },
  {
    id: "R007_PREGNANCY_FOLATE",
    description: "Pregnancy → folate",
    supplement_slug: "folate",
    test: (a) => a.pregnancy_status === "yes",
    rationale: () =>
      "Folate (folic acid / 5-MTHF) reduces neural tube defect risk during early pregnancy.",
  },
  {
    id: "R008_LOW_DAIRY_VITAMIN_D",
    description: "No dairy + non-sunny lifestyle → vitamin D synergy",
    supplement_slug: "vitamin_d",
    test: (a) => a.dairy_per_week === "never" && a.sun_exposure !== "lots",
    rationale: () =>
      "Limited dairy and limited sun together compound vitamin D shortfall risk.",
  },
  {
    id: "R009_PREGNANCY_OMEGA3",
    description: "Pregnancy → omega-3 (DHA)",
    supplement_slug: "omega_3",
    test: (a) => a.pregnancy_status === "yes",
    rationale: () =>
      "DHA during pregnancy supports fetal brain and retinal development.",
  },
  {
    id: "R010_PREGNANCY_IRON",
    description: "Pregnancy → iron",
    supplement_slug: "iron",
    test: (a) => a.pregnancy_status === "yes",
    rationale: () =>
      "Pregnancy roughly doubles daily iron needs (~27 mg) to support expanding blood volume.",
  },
];

/**
 * Apply all rules, dedupe by supplement, gate by pregnancy_safe.
 * Pure function — no I/O, no Date.now(), no Math.random(). Sorted output.
 */
export function recommend(answers: QuizAnswers): Recommendation[] {
  // Collect (rule, reason) pairs whose tests pass.
  const fired = RULES.filter((r) => r.test(answers)).map((r) => ({
    rule: r,
    reason: r.rationale(answers),
  }));

  // Group by supplement_slug, preserving rule firing order within each group.
  const grouped = new Map<
    string,
    { rule_ids: string[]; rationale: { rule_id: string; reason: string }[] }
  >();

  for (const { rule, reason } of fired) {
    const entry = grouped.get(rule.supplement_slug) ?? {
      rule_ids: [],
      rationale: [],
    };
    entry.rule_ids.push(rule.id);
    entry.rationale.push({ rule_id: rule.id, reason });
    grouped.set(rule.supplement_slug, entry);
  }

  const out: Recommendation[] = [];
  for (const [slug, { rule_ids, rationale }] of grouped) {
    const supp = getSupplement(slug);
    if (!supp) continue; // rule references unknown supplement → ignore

    // Domain rule 3: pregnancy gates the universe.
    if (answers.pregnancy_status === "yes" && !supp.pregnancy_safe) continue;

    out.push({
      supplement_slug: slug,
      name: supp.name,
      dose: supp.typical_dose,
      rule_ids,
      rationale,
      pregnancy_safe: supp.pregnancy_safe,
    });
  }

  // Stable, deterministic order.
  out.sort((a, b) => a.supplement_slug.localeCompare(b.supplement_slug));
  return out;
}
