import { describe, it, expect } from "vitest";
import type { QuizAnswers } from "@/lib/quiz/schemas";
import { recommend, RULES } from "./rules";

// ─── Test fixtures ─────────────────────────────────────────────────────────

const baseHealthyMale: QuizAnswers = {
  age_band: "31-50",
  sex_at_birth: "male",
  pregnancy_status: "not_applicable",
  dietary_pattern: "omnivore",
  fruits_veggies_per_day: 5,
  fish_per_week: "3+",
  dairy_per_week: "daily",
  sleep_hours: 7.5,
  sleep_quality: 4,
  trouble_falling_asleep: "rarely",
  stress_level: 2,
  exercise_per_week: "3-4",
  sun_exposure: "moderate",
  alcohol_per_week: "1-3",
  smoker: false,
  medications: ["none"],
  conditions: ["none"],
};

const merge = (...overrides: Array<Partial<QuizAnswers>>): QuizAnswers =>
  overrides.reduce<QuizAnswers>((acc, o) => ({ ...acc, ...o }), {
    ...baseHealthyMale,
  });

const slugs = (answers: QuizAnswers) =>
  recommend(answers).map((r) => r.supplement_slug);

// ─── Tests ────────────────────────────────────────────────────────────────

describe("recommendation engine", () => {
  it("healthy active male → no recommendations fire", () => {
    expect(recommend(baseHealthyMale)).toEqual([]);
  });

  it("minimal sun exposure → vitamin_d", () => {
    expect(slugs(merge({ sun_exposure: "minimal" }))).toContain("vitamin_d");
  });

  it("vegan diet → vitamin_b12", () => {
    expect(slugs(merge({ dietary_pattern: "vegan" }))).toContain("vitamin_b12");
  });

  it("stress 5 → magnesium_glycinate", () => {
    expect(slugs(merge({ stress_level: 5 }))).toContain("magnesium_glycinate");
  });

  it("short sleep (5h) → magnesium_glycinate", () => {
    expect(slugs(merge({ sleep_hours: 5 }))).toContain("magnesium_glycinate");
  });

  it("stress 5 + poor sleep → ONE magnesium with both rule_ids", () => {
    const recs = recommend(merge({ stress_level: 5, sleep_hours: 5 }));
    const mag = recs.filter((r) => r.supplement_slug === "magnesium_glycinate");
    expect(mag).toHaveLength(1);
    expect(mag[0].rule_ids).toEqual(
      expect.arrayContaining(["R003_HIGH_STRESS_MAGNESIUM", "R004_POOR_SLEEP_MAGNESIUM"]),
    );
    expect(mag[0].rationale.length).toBe(2);
  });

  it("never-fish omnivore → omega_3", () => {
    expect(slugs(merge({ fish_per_week: "never" }))).toContain("omega_3");
  });

  it("premenopausal female (25, not pregnant) → iron", () => {
    expect(
      slugs(
        merge({
          sex_at_birth: "female",
          age_band: "19-30",
          pregnancy_status: "no",
        }),
      ),
    ).toContain("iron");
  });

  it("postmenopausal female (60) → no female-iron rule", () => {
    expect(
      slugs(
        merge({
          sex_at_birth: "female",
          age_band: "51-70",
          pregnancy_status: "not_applicable",
        }),
      ),
    ).not.toContain("iron");
  });

  it("pregnant → folate + omega_3 + iron all recommended", () => {
    const recs = slugs(
      merge({
        sex_at_birth: "female",
        age_band: "19-30",
        pregnancy_status: "yes",
      }),
    );
    expect(recs).toEqual(expect.arrayContaining(["folate", "omega_3", "iron"]));
  });

  it("pregnant + vegan → b12 still recommended (pregnancy_safe)", () => {
    const recs = slugs(
      merge({
        sex_at_birth: "female",
        age_band: "19-30",
        pregnancy_status: "yes",
        dietary_pattern: "vegan",
        fish_per_week: "never",
      }),
    );
    expect(recs).toContain("vitamin_b12");
  });

  it("invariant: every recommendation for a pregnant user is pregnancy_safe", () => {
    const recs = recommend(
      merge({
        sex_at_birth: "female",
        age_band: "19-30",
        pregnancy_status: "yes",
        dietary_pattern: "vegan",
        sun_exposure: "minimal",
        sleep_hours: 5,
        stress_level: 5,
        fish_per_week: "never",
        dairy_per_week: "never",
      }),
    );
    expect(recs.length).toBeGreaterThan(0);
    for (const r of recs) expect(r.pregnancy_safe).toBe(true);
  });

  it("output is sorted alphabetically by supplement_slug for stable rendering", () => {
    const recs = recommend(
      merge({
        sun_exposure: "minimal",
        dietary_pattern: "vegan",
        fish_per_week: "never",
        stress_level: 5,
      }),
    );
    const sortedSlugs = [...recs.map((r) => r.supplement_slug)].sort((a, b) =>
      a.localeCompare(b),
    );
    expect(recs.map((r) => r.supplement_slug)).toEqual(sortedSlugs);
  });

  it("pure: identical inputs yield deeply equal outputs across calls", () => {
    const input = merge({
      sun_exposure: "minimal",
      dietary_pattern: "vegan",
      stress_level: 5,
    });
    expect(recommend(input)).toEqual(recommend(input));
  });

  it("each rec carries a non-empty dose string from supplements.json", () => {
    const recs = recommend(
      merge({
        sun_exposure: "minimal",
        dietary_pattern: "vegan",
        stress_level: 5,
      }),
    );
    for (const r of recs) {
      expect(r.dose).toMatch(/.+/);
      expect(r.name).toMatch(/.+/);
      expect(r.rule_ids.length).toBeGreaterThan(0);
    }
  });

  it("RULES export is non-empty and every rule has a unique id", () => {
    const ids = RULES.map((r) => r.id);
    expect(ids.length).toBeGreaterThanOrEqual(10);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
