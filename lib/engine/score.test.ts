import { describe, it, expect } from "vitest";
import type { QuizAnswers } from "@/lib/quiz/schemas";
import { computeScore, SCORE_BASELINE, SCORE_RULES } from "./score";

const baseNeutral: QuizAnswers = {
  age_band: "31-50",
  sex_at_birth: "male",
  pregnancy_status: "not_applicable",
  dietary_pattern: "omnivore",
  fruits_veggies_per_day: 3, // neither bonus nor penalty
  fish_per_week: "1-2",
  dairy_per_week: "few",
  sleep_hours: 6.5, // not <6, not in 7-9 → neutral
  sleep_quality: 3,
  trouble_falling_asleep: "sometimes",
  stress_level: 3,
  exercise_per_week: "1-2", // neither bonus nor penalty
  sun_exposure: "moderate",
  alcohol_per_week: "1-3",
  smoker: false,
  medications: ["none"],
  conditions: ["none"],
};

const merge = (...overrides: Array<Partial<QuizAnswers>>): QuizAnswers =>
  overrides.reduce<QuizAnswers>((acc, o) => ({ ...acc, ...o }), {
    ...baseNeutral,
  });

describe("health score", () => {
  it("neutral inputs → score equals baseline, no contributions", () => {
    const r = computeScore(baseNeutral);
    expect(r.baseline).toBe(SCORE_BASELINE);
    expect(r.contributions).toEqual([]);
    expect(r.raw_score).toBe(SCORE_BASELINE);
    expect(r.score).toBe(SCORE_BASELINE);
  });

  it("idealized healthy lifestyle → score climbs above baseline", () => {
    const r = computeScore(
      merge({
        sleep_hours: 8,
        sleep_quality: 5,
        stress_level: 1,
        exercise_per_week: "5+",
        fruits_veggies_per_day: 7,
        fish_per_week: "3+",
        sun_exposure: "lots",
      }),
    );
    expect(r.score).toBeGreaterThan(SCORE_BASELINE);
    expect(r.contributions.every((c) => c.delta > 0)).toBe(true);
  });

  it("smoker + heavy drinker → score drops well below baseline", () => {
    const r = computeScore(
      merge({ smoker: true, alcohol_per_week: "8+" }),
    );
    expect(r.score).toBeLessThan(SCORE_BASELINE);
    const ids = r.contributions.map((c) => c.rule_id);
    expect(ids).toContain("S013_SMOKER");
    expect(ids).toContain("S014_HEAVY_DRINKER");
  });

  it("invariant: sum(contributions.delta) === raw_score - baseline (5 sampled inputs)", () => {
    const samples: QuizAnswers[] = [
      baseNeutral,
      merge({ sleep_hours: 5, stress_level: 5, exercise_per_week: "0" }),
      merge({
        sleep_hours: 8,
        sleep_quality: 5,
        stress_level: 1,
        fruits_veggies_per_day: 6,
      }),
      merge({ smoker: true, alcohol_per_week: "8+", sun_exposure: "minimal" }),
      merge({
        sleep_hours: 10,
        sleep_quality: 4,
        fruits_veggies_per_day: 0,
        fish_per_week: "3+",
      }),
    ];
    for (const s of samples) {
      const r = computeScore(s);
      const sum = r.contributions.reduce((acc, c) => acc + c.delta, 0);
      expect(sum).toBe(r.raw_score - r.baseline);
    }
  });

  it("contributions are sorted by |delta| desc (stable on ties via rule_id)", () => {
    const r = computeScore(
      merge({
        smoker: true, // -15
        sleep_hours: 5, // -10
        exercise_per_week: "5+", // +10
        alcohol_per_week: "8+", // -10
        fruits_veggies_per_day: 7, // +8
        sleep_quality: 1, // -8
      }),
    );
    const abs = r.contributions.map((c) => Math.abs(c.delta));
    for (let i = 1; i < abs.length; i++) {
      expect(abs[i - 1]).toBeGreaterThanOrEqual(abs[i]);
    }
    // Tie-break: for any two consecutive entries with same |delta|, ids ascending.
    for (let i = 1; i < r.contributions.length; i++) {
      if (Math.abs(r.contributions[i - 1].delta) === Math.abs(r.contributions[i].delta)) {
        expect(
          r.contributions[i - 1].rule_id.localeCompare(r.contributions[i].rule_id),
        ).toBeLessThanOrEqual(0);
      }
    }
  });

  it("score is clamped to [0, 100]; raw_score may exceed those bounds", () => {
    // Pile every penalty to push raw below zero.
    const punish = computeScore(
      merge({
        smoker: true,
        alcohol_per_week: "8+",
        sleep_hours: 5,
        sleep_quality: 1,
        stress_level: 5,
        exercise_per_week: "0",
        fruits_veggies_per_day: 0,
        sun_exposure: "minimal",
      }),
    );
    expect(punish.raw_score).toBeLessThan(0);
    expect(punish.score).toBe(0);

    // Pile every bonus to push raw above 100.
    const reward = computeScore(
      merge({
        sleep_hours: 8,
        sleep_quality: 5,
        stress_level: 1,
        exercise_per_week: "5+",
        fruits_veggies_per_day: 8,
        fish_per_week: "3+",
        sun_exposure: "lots",
      }),
    );
    // baseline 70 + (8+5+5+10+8+4+3) = 113
    expect(reward.raw_score).toBeGreaterThan(100);
    expect(reward.score).toBe(100);
  });

  it("deterministic across calls", () => {
    const input = merge({ smoker: true, sleep_hours: 5, stress_level: 5 });
    expect(computeScore(input)).toEqual(computeScore(input));
  });

  it("all rule ids are unique", () => {
    const ids = SCORE_RULES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every emitted contribution has a non-empty label and rule_id", () => {
    const r = computeScore(
      merge({ smoker: true, sleep_hours: 5, fruits_veggies_per_day: 7 }),
    );
    for (const c of r.contributions) {
      expect(c.rule_id).toMatch(/^S\d{3}_/);
      expect(c.label.length).toBeGreaterThan(0);
      expect(c.delta).not.toBe(0);
    }
  });
});
