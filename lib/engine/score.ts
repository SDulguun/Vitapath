// Explainable health score. Pure function: QuizAnswers → { score, raw_score,
// baseline, contributions[] }. Each contribution carries the rule_id that
// produced it, a human label, and a signed delta. Sum(contributions.delta)
// equals raw_score - baseline by construction. The user-facing `score` is
// raw_score clamped to 0-100.
//
// This is a wellness rubric, not a medical assessment — see the disclaimer
// the UI must always render alongside.

import type { QuizAnswers } from "@/lib/quiz/schemas";

export type ScoreContribution = {
  rule_id: string;
  label: string;
  delta: number;
};

export type HealthScore = {
  baseline: number;
  raw_score: number;
  score: number; // clamped to [0, 100]
  contributions: ScoreContribution[]; // sorted by |delta| desc, stable
};

type ScoreRule = {
  id: string;
  label: string;
  delta: (a: QuizAnswers) => number;
};

export const SCORE_BASELINE = 70;

export const SCORE_RULES: ReadonlyArray<ScoreRule> = [
  // Sleep
  {
    id: "S001_GOOD_SLEEP_HOURS",
    label: "Sleep hours in healthy range (7–9)",
    delta: (a) => (a.sleep_hours >= 7 && a.sleep_hours <= 9 ? +8 : 0),
  },
  {
    id: "S002_SHORT_SLEEP",
    label: "Short sleep (<6 h)",
    delta: (a) => (a.sleep_hours < 6 ? -10 : 0),
  },
  {
    id: "S003_LONG_SLEEP",
    label: "Long sleep (>9 h)",
    delta: (a) => (a.sleep_hours > 9 ? -5 : 0),
  },
  {
    id: "S004_HIGH_SLEEP_QUALITY",
    label: "High sleep quality",
    delta: (a) => (a.sleep_quality >= 4 ? +5 : 0),
  },
  {
    id: "S005_LOW_SLEEP_QUALITY",
    label: "Low sleep quality",
    delta: (a) => (a.sleep_quality <= 2 ? -8 : 0),
  },

  // Stress
  {
    id: "S006_LOW_STRESS",
    label: "Low stress",
    delta: (a) => (a.stress_level <= 2 ? +5 : 0),
  },
  {
    id: "S007_HIGH_STRESS",
    label: "High stress",
    delta: (a) => (a.stress_level >= 4 ? -8 : 0),
  },

  // Movement
  {
    id: "S008_REGULAR_EXERCISE",
    label: "Regular exercise (3+ days/week)",
    delta: (a) =>
      a.exercise_per_week === "3-4" || a.exercise_per_week === "5+" ? +10 : 0,
  },
  {
    id: "S009_SEDENTARY",
    label: "Sedentary (0 workouts/week)",
    delta: (a) => (a.exercise_per_week === "0" ? -10 : 0),
  },

  // Diet quality
  {
    id: "S010_PRODUCE_INTAKE",
    label: "Plenty of fruits & vegetables",
    delta: (a) => (a.fruits_veggies_per_day >= 5 ? +8 : 0),
  },
  {
    id: "S011_LOW_PRODUCE",
    label: "Low produce intake",
    delta: (a) => (a.fruits_veggies_per_day <= 1 ? -8 : 0),
  },
  {
    id: "S012_REGULAR_FISH",
    label: "Regular fish intake (3+/week)",
    delta: (a) => (a.fish_per_week === "3+" ? +4 : 0),
  },

  // Lifestyle
  {
    id: "S013_SMOKER",
    label: "Currently smokes or vapes",
    delta: (a) => (a.smoker ? -15 : 0),
  },
  {
    id: "S014_HEAVY_DRINKER",
    label: "Heavy alcohol use (8+ drinks/week)",
    delta: (a) => (a.alcohol_per_week === "8+" ? -10 : 0),
  },
  {
    id: "S015_OUTDOOR_LIFESTYLE",
    label: "Lots of sun exposure",
    delta: (a) => (a.sun_exposure === "lots" ? +3 : 0),
  },
  {
    id: "S016_INDOOR_LIFESTYLE",
    label: "Mostly indoors",
    delta: (a) => (a.sun_exposure === "minimal" ? -5 : 0),
  },
];

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

export function computeScore(answers: QuizAnswers): HealthScore {
  const contributions: ScoreContribution[] = SCORE_RULES.map((r) => ({
    rule_id: r.id,
    label: r.label,
    delta: r.delta(answers),
  }))
    .filter((c) => c.delta !== 0)
    // Sort by |delta| desc; tie-break by rule_id for stability.
    .sort((a, b) => {
      const d = Math.abs(b.delta) - Math.abs(a.delta);
      return d !== 0 ? d : a.rule_id.localeCompare(b.rule_id);
    });

  const sum = contributions.reduce((s, c) => s + c.delta, 0);
  const raw_score = SCORE_BASELINE + sum;
  return {
    baseline: SCORE_BASELINE,
    raw_score,
    score: clamp(raw_score, 0, 100),
    contributions,
  };
}
