import { z } from "zod";

// ─── Enums shared across steps ─────────────────────────────────────────────

export const AgeBandSchema = z.enum([
  "13-18",
  "19-30",
  "31-50",
  "51-70",
  "71+",
]);

export const SexAtBirthSchema = z.enum([
  "male",
  "female",
  "intersex",
  "prefer_not_to_say",
]);

export const PregnancyStatusSchema = z.enum([
  "not_applicable",
  "no",
  "yes",
  "unsure",
]);

export const DietaryPatternSchema = z.enum([
  "omnivore",
  "pescatarian",
  "vegetarian",
  "vegan",
  "keto",
  "other",
]);

export const FrequencyLowSchema = z.enum(["never", "1-2", "3+"]);
export const FrequencyDairySchema = z.enum(["never", "few", "daily"]);
export const ExerciseSchema = z.enum(["0", "1-2", "3-4", "5+"]);
export const SunExposureSchema = z.enum(["minimal", "moderate", "lots"]);
export const TroubleSleepSchema = z.enum(["rarely", "sometimes", "often"]);
export const AlcoholSchema = z.enum(["0", "1-3", "4-7", "8+"]);

export const MedicationSlugSchema = z.enum([
  "none",
  "ssri",
  "warfarin",
  "anticoagulant",
  "levodopa",
  "tetracycline",
]);

export const ConditionSlugSchema = z.enum([
  "none",
  "hemochromatosis",
  "liver_disease",
  "anticoagulant_use",
]);

// ─── Per-step schemas (each is permissive about other steps' fields) ──────

export const Step1Schema = z.object({
  age_band: AgeBandSchema,
  sex_at_birth: SexAtBirthSchema,
  pregnancy_status: PregnancyStatusSchema,
});

export const Step2Schema = z.object({
  dietary_pattern: DietaryPatternSchema,
  fruits_veggies_per_day: z.coerce.number().int().min(0).max(10),
  fish_per_week: FrequencyLowSchema,
  dairy_per_week: FrequencyDairySchema,
});

export const Step3Schema = z.object({
  sleep_hours: z.coerce.number().min(3).max(12),
  sleep_quality: z.coerce.number().int().min(1).max(5),
  trouble_falling_asleep: TroubleSleepSchema,
});

export const Step4Schema = z.object({
  stress_level: z.coerce.number().int().min(1).max(5),
  exercise_per_week: ExerciseSchema,
  sun_exposure: SunExposureSchema,
});

export const Step5Schema = z.object({
  alcohol_per_week: AlcoholSchema,
  smoker: z.coerce.boolean(),
  medications: z.array(MedicationSlugSchema).min(1),
  conditions: z.array(ConditionSlugSchema).min(1),
});

export const STEP_SCHEMAS = [
  Step1Schema,
  Step2Schema,
  Step3Schema,
  Step4Schema,
  Step5Schema,
] as const;

export const TOTAL_STEPS = STEP_SCHEMAS.length;

// ─── Full quiz answers (the merged shape) ─────────────────────────────────

export const QuizAnswersSchema = Step1Schema.extend(Step2Schema.shape)
  .extend(Step3Schema.shape)
  .extend(Step4Schema.shape)
  .extend(Step5Schema.shape);

export type QuizAnswers = z.infer<typeof QuizAnswersSchema>;
export type DraftAnswers = Partial<QuizAnswers>;
