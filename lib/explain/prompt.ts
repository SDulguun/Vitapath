import "server-only";
import type { ResultsRecommendation } from "@/lib/results/data";

export const SYSTEM_PROMPT = `You explain a single vitamin or supplement recommendation to a non-expert reader. Constraints:
- Write exactly two sentences. No more, no fewer.
- Voice is factual and warm. Never prescriptive. Do not say "you should" or "this will fix".
- Cite the supporting study by topic or year if one is provided.
- No medical advice. No claims to diagnose or treat.
- No em dashes. Use periods, commas, or colons.
- No exclamation marks. No emojis. No headings or bullet points.
- First sentence: connect the person's situation to the nutrient or supplement.
- Second sentence: cite the study and note how the dose addresses the situation.`;

/** Build the user-side prompt from a single recommendation. Only includes
 *  the fields needed to ground the explanation: rationale (gate reasons),
 *  supplement name + dose, and the top one or two cited studies. */
export function buildPrompt(rec: ResultsRecommendation): string {
  const reasons = rec.rationale.map((r) => `- ${r.reason}`).join("\n");
  const evidence = rec.evidence
    .slice(0, 2)
    .map((s) => `- "${s.title}" (${s.year}): ${s.summary}`)
    .join("\n");

  return [
    `Supplement: ${rec.name}`,
    `Suggested dose: ${rec.dose}`,
    ``,
    `Why this person:`,
    reasons || "- General recommendation",
    ``,
    `Supporting studies:`,
    evidence || "- No studies provided",
    ``,
    `Write exactly two sentences explaining why this supplement at this dose was recommended for this specific person.`,
  ].join("\n");
}
