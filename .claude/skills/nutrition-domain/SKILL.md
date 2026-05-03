---
name: nutrition-domain
description: Vitamin and supplement domain knowledge for VitaPath — RDAs by age/sex, contraindications (pregnancy, common medications), known interactions, and synergies. Invoke whenever editing files under lib/engine/ (rules.ts, score.ts, interactions.ts) or designing new quiz questions that gate recommendations.
---

# nutrition-domain

This skill encodes the nutrition knowledge that the VitaPath recommendation
engine depends on. The reference JSON files in `references/` are the
**single source of truth** — the rule engine imports them at runtime, and any
nutritionist-facing change should land in those files first.

## When to use this skill

- Implementing or editing any file under `lib/engine/`.
- Adding a new supplement to the recommendation universe.
- Writing a new quiz question whose answer should affect a recommendation,
  contraindication, or warning.
- Reviewing whether a proposed recommendation is safe for a given user profile.

## Reference data files

| File | Shape | Purpose |
|------|-------|---------|
| `references/nutrient_rdas.json` | `{ nutrient: { age_band: { sex: { rda_mg, ul_mg } } } }` | Recommended Daily Allowances and Tolerable Upper Limits by age band and sex. Source: NIH ODS fact sheets. |
| `references/interactions.json` | `[{ a, b, severity, summary }]` | Pairwise interactions between supplements OR between supplement + medication. `severity` ∈ low/moderate/high. |
| `references/contraindications.json` | `[{ supplement_slug, condition, action, message }]` | Hard contraindications. `action` ∈ remove/warn. Used by the interaction checker to drop unsafe recs (e.g. high-dose retinol during pregnancy) before they reach the user. |

## Rules of thumb (encoded as engine logic, not freeform)

1. Never recommend a dose above the UL for the user's age band and sex.
2. If a recommendation has a `severity: high` contraindication for any disclosed
   user condition, the rec must be **removed** and a warning added — not just
   warned.
3. Pregnancy and lactation gate the entire supplement universe; only items
   tagged `pregnancy_safe: true` may be recommended.
4. Drug-supplement interactions always show the drug name verbatim in the
   warning; do not paraphrase medication names.
5. Synergies (D + K2, magnesium + B6) are surfaced as "consider also" in the
   rationale, never as separate independent recommendations.

## Disclaimer

This skill encodes general dietary guidance, not medical advice. Every
user-facing surface in the app must repeat the medical disclaimer; the skill
exists to make it harder for the engine to produce harmful suggestions, not to
replace a clinician.
