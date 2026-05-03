import { describe, it, expect } from "vitest";
import type { QuizAnswers } from "@/lib/quiz/schemas";
import type { Recommendation } from "./types";
import { checkInteractions } from "./interactions";

// ─── Helpers ───────────────────────────────────────────────────────────────

const baseAnswers: QuizAnswers = {
  age_band: "31-50",
  sex_at_birth: "male",
  pregnancy_status: "not_applicable",
  dietary_pattern: "omnivore",
  fruits_veggies_per_day: 4,
  fish_per_week: "1-2",
  dairy_per_week: "few",
  sleep_hours: 7,
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

function withAnswers(overrides: Partial<QuizAnswers>): QuizAnswers {
  return { ...baseAnswers, ...overrides };
}

function makeRec(
  slug: string,
  overrides: Partial<Recommendation> = {},
): Recommendation {
  return {
    supplement_slug: slug,
    name: overrides.name ?? slug.replace(/_/g, " "),
    dose: overrides.dose ?? "1 capsule/day",
    rule_ids: overrides.rule_ids ?? ["TEST_RULE"],
    rationale: overrides.rationale ?? [
      { rule_id: "TEST_RULE", reason: "test fixture" },
    ],
    pregnancy_safe: overrides.pregnancy_safe ?? true,
  };
}

// ─── Tests ─────────────────────────────────────────────────────────────────

describe("safety / interaction checker", () => {
  it("St John's Wort + SSRI → high-severity drug_interaction with 'ssri' verbatim", () => {
    const recs = [makeRec("st_johns_wort")];
    const { warnings, recommendations } = checkInteractions(
      withAnswers({ medications: ["ssri"] }),
      recs,
    );
    expect(recommendations).toEqual(recs); // not dropped — just warned
    const w = warnings.find((x) => x.kind === "drug_interaction");
    expect(w?.severity).toBe("high");
    expect(w?.medication).toBe("ssri");
    expect(w?.message).toContain("ssri");
  });

  it("Vitamin K + warfarin → high-severity drug_interaction with 'warfarin' verbatim", () => {
    const { warnings, recommendations } = checkInteractions(
      withAnswers({ medications: ["warfarin"] }),
      [makeRec("vitamin_k")],
    );
    expect(recommendations.length).toBe(1);
    const w = warnings.find((x) => x.kind === "drug_interaction");
    expect(w?.severity).toBe("high");
    expect(w?.message).toContain("warfarin");
  });

  it("Iron + Calcium recs → moderate supplement_interaction (timing warning)", () => {
    const { warnings } = checkInteractions(baseAnswers, [
      makeRec("iron"),
      makeRec("calcium"),
    ]);
    const w = warnings.find((x) => x.kind === "supplement_interaction");
    expect(w?.severity).toBe("moderate");
    expect(w?.message.toLowerCase()).toMatch(/2 hours|absorption/);
  });

  it("Pregnancy + non-safe rec → rec removed + high pregnancy_removed warning", () => {
    const { recommendations, warnings } = checkInteractions(
      withAnswers({
        sex_at_birth: "female",
        pregnancy_status: "yes",
      }),
      [makeRec("vitamin_a_high_dose", { pregnancy_safe: false })],
    );
    expect(recommendations).toEqual([]); // dropped
    const w = warnings.find((x) => x.kind === "pregnancy_removed");
    expect(w?.severity).toBe("high");
    expect(w?.supplement_slug).toBe("vitamin_a_high_dose");
  });

  it("Pregnancy + folate → kept, no warning", () => {
    const folate = makeRec("folate", { pregnancy_safe: true });
    const { recommendations, warnings } = checkInteractions(
      withAnswers({
        sex_at_birth: "female",
        pregnancy_status: "yes",
      }),
      [folate],
    );
    expect(recommendations).toEqual([folate]);
    expect(warnings).toEqual([]);
  });

  it("No relevant meds, no condition, single rec → empty warnings", () => {
    const { warnings, recommendations } = checkInteractions(baseAnswers, [
      makeRec("vitamin_d"),
    ]);
    expect(warnings).toEqual([]);
    expect(recommendations.length).toBe(1);
  });

  it("Hemochromatosis + iron rec → rec removed (condition_removed)", () => {
    const { recommendations, warnings } = checkInteractions(
      withAnswers({ conditions: ["hemochromatosis"] }),
      [makeRec("iron")],
    );
    expect(recommendations).toEqual([]);
    const w = warnings.find((x) => x.kind === "condition_removed");
    expect(w?.severity).toBe("high");
    expect(w?.supplement_slug).toBe("iron");
  });

  it("Multi-warning ordering: high severities before moderates", () => {
    const { warnings } = checkInteractions(
      withAnswers({ medications: ["ssri", "warfarin"] }),
      [makeRec("st_johns_wort"), makeRec("vitamin_k"), makeRec("iron"), makeRec("calcium")],
    );
    expect(warnings.length).toBeGreaterThanOrEqual(3);
    // First warning must not be lower severity than the last
    const ranks = warnings.map((w) => ({ high: 3, moderate: 2, low: 1 }[w.severity]));
    for (let i = 1; i < ranks.length; i++) {
      expect(ranks[i - 1]).toBeGreaterThanOrEqual(ranks[i]);
    }
  });

  it("deterministic across calls", () => {
    const a = withAnswers({ medications: ["warfarin"] });
    const recs = [makeRec("vitamin_k"), makeRec("iron"), makeRec("calcium")];
    expect(checkInteractions(a, recs)).toEqual(checkInteractions(a, recs));
  });
});
