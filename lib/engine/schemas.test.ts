import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  NutrientRdasSchema,
  InteractionsSchema,
  ContraindicationsSchema,
} from "./schemas";

const refsDir = resolve(
  process.cwd(),
  ".claude/skills/nutrition-domain/references",
);

function readJson(name: string): unknown {
  return JSON.parse(readFileSync(resolve(refsDir, name), "utf-8"));
}

describe("nutrition-domain reference data", () => {
  it("nutrient_rdas.json validates against NutrientRdasSchema", () => {
    const parsed = NutrientRdasSchema.safeParse(readJson("nutrient_rdas.json"));
    if (!parsed.success) {
      throw new Error(
        `nutrient_rdas.json schema errors:\n${JSON.stringify(parsed.error.format(), null, 2)}`,
      );
    }
    expect(parsed.data._meta.source).toMatch(/.+/);
    expect(Object.keys(parsed.data).filter((k) => k !== "_meta").length).toBeGreaterThan(0);
  });

  it("interactions.json validates against InteractionsSchema", () => {
    const parsed = InteractionsSchema.safeParse(readJson("interactions.json"));
    if (!parsed.success) {
      throw new Error(
        `interactions.json schema errors:\n${JSON.stringify(parsed.error.format(), null, 2)}`,
      );
    }
    expect(parsed.data.length).toBeGreaterThanOrEqual(3);
    // Specific seeded entries we rely on for goal 9 must be present.
    expect(
      parsed.data.find((i) => i.a === "st_johns_wort" && i.b === "ssri")?.severity,
    ).toBe("high");
    expect(
      parsed.data.find((i) => i.a === "vitamin_k" && i.b === "warfarin")?.severity,
    ).toBe("high");
  });

  it("contraindications.json validates against ContraindicationsSchema", () => {
    const parsed = ContraindicationsSchema.safeParse(
      readJson("contraindications.json"),
    );
    if (!parsed.success) {
      throw new Error(
        `contraindications.json schema errors:\n${JSON.stringify(parsed.error.format(), null, 2)}`,
      );
    }
    expect(parsed.data.length).toBeGreaterThanOrEqual(3);
    // Pregnancy + vitamin A high-dose must be marked 'remove' (not just 'warn').
    const pregVitA = parsed.data.find(
      (c) => c.supplement_slug === "vitamin_a_high_dose" && c.condition === "pregnancy",
    );
    expect(pregVitA?.action).toBe("remove");
  });

  it("every contraindication action is one of the allowed values", () => {
    const parsed = ContraindicationsSchema.parse(readJson("contraindications.json"));
    for (const c of parsed) {
      expect(["remove", "warn"]).toContain(c.action);
    }
  });
});
