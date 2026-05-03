// Loads + validates the nutrition-domain reference data and the supplement
// catalogue at module load time. If any file is malformed, the import throws
// — surfacing the error in tests and at server boot, never at request time.

import supplementsRaw from "@/.claude/mcp/supplement-evidence/data/supplements.json";
import nutrientRdasRaw from "@/.claude/skills/nutrition-domain/references/nutrient_rdas.json";
import interactionsRaw from "@/.claude/skills/nutrition-domain/references/interactions.json";
import contraindicationsRaw from "@/.claude/skills/nutrition-domain/references/contraindications.json";

import {
  SupplementsSchema,
  NutrientRdasSchema,
  InteractionsSchema,
  ContraindicationsSchema,
  type Supplement,
} from "./schemas";

export const SUPPLEMENTS: ReadonlyArray<Supplement> =
  SupplementsSchema.parse(supplementsRaw);
export const NUTRIENT_RDAS = NutrientRdasSchema.parse(nutrientRdasRaw);
export const INTERACTIONS = InteractionsSchema.parse(interactionsRaw);
export const CONTRAINDICATIONS = ContraindicationsSchema.parse(
  contraindicationsRaw,
);

const supplementBySlug = new Map<string, Supplement>(
  SUPPLEMENTS.map((s) => [s.slug, s]),
);

export function getSupplement(slug: string): Supplement | undefined {
  return supplementBySlug.get(slug);
}
