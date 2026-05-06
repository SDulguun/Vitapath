// Pure cost-optimized alternative selector.
//
// Each supplement carries a `brands` array of plausibly priced offerings.
// One is flagged is_primary — the engine's default pick (chosen for quality
// or evidence weight, not price). chooseAlternative() finds the cheapest
// brand that ALSO meets the recommended dose and is genuinely cheaper than
// the primary; otherwise returns null.

import type { Brand, Supplement } from "./schemas";

export function getPrimaryBrand(supplement: Supplement): Brand {
  return supplement.brands.find((b) => b.is_primary) ?? supplement.brands[0];
}

export function chooseAlternative(supplement: Supplement): Brand | null {
  const primary = getPrimaryBrand(supplement);
  const candidates = supplement.brands.filter(
    (b) =>
      b !== primary &&
      b.meets_dose &&
      b.price_usd_per_month < primary.price_usd_per_month,
  );
  if (candidates.length === 0) return null;
  return candidates.reduce((cheapest, b) =>
    b.price_usd_per_month < cheapest.price_usd_per_month ? b : cheapest,
  );
}
