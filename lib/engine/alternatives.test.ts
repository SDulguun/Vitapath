import { describe, it, expect } from "vitest";
import type { Supplement } from "./schemas";
import { chooseAlternative, getPrimaryBrand } from "./alternatives";

const make = (brands: Supplement["brands"]): Supplement => ({
  slug: "x",
  name: "X",
  forms: ["capsule"],
  typical_dose: "1 cap/day",
  pregnancy_safe: true,
  studies: [
    { title: "t", year: 2020, summary: "s", concerns: ["x"] },
  ],
  brands,
});

describe("alternative selector", () => {
  it("returns cheapest brand meeting dose, when cheaper than primary", () => {
    const s = make([
      { name: "Pricey", price_usd_per_month: 24, meets_dose: true, is_primary: true },
      { name: "Mid", price_usd_per_month: 14, meets_dose: true },
      { name: "Cheap", price_usd_per_month: 9, meets_dose: true },
    ]);
    const alt = chooseAlternative(s);
    expect(alt?.name).toBe("Cheap");
  });

  it("returns null when only 1 brand", () => {
    const s = make([
      { name: "Solo", price_usd_per_month: 20, meets_dose: true, is_primary: true },
    ]);
    expect(chooseAlternative(s)).toBeNull();
  });

  it("returns null when no brand is cheaper than the primary", () => {
    const s = make([
      { name: "Cheap-ish primary", price_usd_per_month: 5, meets_dose: true, is_primary: true },
      { name: "Premium", price_usd_per_month: 30, meets_dose: true },
    ]);
    expect(chooseAlternative(s)).toBeNull();
  });

  it("filters out brands that do not meet dose, even if cheaper", () => {
    const s = make([
      { name: "Primary", price_usd_per_month: 20, meets_dose: true, is_primary: true },
      { name: "Cheap underdose", price_usd_per_month: 4, meets_dose: false },
    ]);
    expect(chooseAlternative(s)).toBeNull();
  });

  it("returns the cheapest among multiple eligible alternatives", () => {
    const s = make([
      { name: "Primary", price_usd_per_month: 30, meets_dose: true, is_primary: true },
      { name: "Mid-A", price_usd_per_month: 20, meets_dose: true },
      { name: "Cheap-A", price_usd_per_month: 10, meets_dose: true },
      { name: "Mid-B", price_usd_per_month: 18, meets_dose: true },
    ]);
    expect(chooseAlternative(s)?.name).toBe("Cheap-A");
  });

  it("falls back to first brand when no is_primary flag is set", () => {
    const s = make([
      { name: "First", price_usd_per_month: 25, meets_dose: true },
      { name: "Cheaper", price_usd_per_month: 12, meets_dose: true },
    ]);
    expect(getPrimaryBrand(s).name).toBe("First");
    expect(chooseAlternative(s)?.name).toBe("Cheaper");
  });

  it("getPrimaryBrand returns the explicitly flagged primary even if first slot is cheaper", () => {
    const s = make([
      { name: "Cheap", price_usd_per_month: 9, meets_dose: true },
      { name: "Curated primary", price_usd_per_month: 22, meets_dose: true, is_primary: true },
    ]);
    expect(getPrimaryBrand(s).name).toBe("Curated primary");
    expect(chooseAlternative(s)?.name).toBe("Cheap");
  });
});
