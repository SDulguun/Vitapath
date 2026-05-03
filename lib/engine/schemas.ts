import { z } from "zod";

// ─── Shared primitives ─────────────────────────────────────────────────────

export const SexSchema = z.enum(["male", "female"]);
export const SeveritySchema = z.enum(["low", "moderate", "high"]);
export const ContraindicationActionSchema = z.enum(["remove", "warn"]);

// ─── nutrient_rdas.json ────────────────────────────────────────────────────
// Shape: { _meta, [nutrient_key]: { [age_band]: { male|female: { rda, ul } } } }

export const RdaUlSchema = z.object({
  rda: z.number().nonnegative(),
  ul: z.number().nonnegative().nullable(),
});

export const AgeBandSchema = z.record(SexSchema, RdaUlSchema);

export const NutrientSchema = z.record(z.string(), AgeBandSchema);

export const NutrientRdasMetaSchema = z.object({
  source: z.string().min(1),
  units: z.string().min(1),
  note: z.string().optional(),
});

export const NutrientRdasSchema = z
  .object({ _meta: NutrientRdasMetaSchema })
  .catchall(NutrientSchema);

// ─── interactions.json ─────────────────────────────────────────────────────

export const InteractionSchema = z.object({
  a: z.string().min(1),
  b: z.string().min(1),
  severity: SeveritySchema,
  summary: z.string().min(1),
});

export const InteractionsSchema = z.array(InteractionSchema);

// ─── contraindications.json ────────────────────────────────────────────────

export const ContraindicationSchema = z.object({
  supplement_slug: z.string().min(1),
  condition: z.string().min(1),
  action: ContraindicationActionSchema,
  message: z.string().min(1),
});

export const ContraindicationsSchema = z.array(ContraindicationSchema);

// ─── Inferred TS types (for downstream engine code) ───────────────────────

export type Sex = z.infer<typeof SexSchema>;
export type Severity = z.infer<typeof SeveritySchema>;
export type ContraindicationAction = z.infer<typeof ContraindicationActionSchema>;
export type RdaUl = z.infer<typeof RdaUlSchema>;
export type Interaction = z.infer<typeof InteractionSchema>;
export type Contraindication = z.infer<typeof ContraindicationSchema>;
export type NutrientRdas = z.infer<typeof NutrientRdasSchema>;
