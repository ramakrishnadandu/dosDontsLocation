import { z } from "zod";

/**
 * Evidence categories. These must NEVER be blurred together (see
 * docs/architecture.md#evidence-model):
 *  - FACT: structured/provider data (opening hours, address, official rating)
 *  - REVIEW_SIGNAL: aggregated signal derived from many reviews
 *  - COMMUNITY_OPINION: a single user-submitted experience
 *  - AI_INTERPRETATION: model-generated synthesis over the above
 */
export const EvidenceType = z.enum([
  "FACT",
  "REVIEW_SIGNAL",
  "COMMUNITY_OPINION",
  "AI_INTERPRETATION",
]);
export type EvidenceType = z.infer<typeof EvidenceType>;

export const EvidenceSource = z.object({
  provider: z.string(),
  evidenceType: EvidenceType,
  count: z.number().int().nonnegative().optional(),
  referenceId: z.string().optional(),
  observedAt: z.string().datetime().optional(),
});
export type EvidenceSource = z.infer<typeof EvidenceSource>;

export const RecommendationCategory = z.enum([
  "DO",
  "CONSIDER",
  "WATCH",
  "MUST_SEE",
  "SPENDING",
  "PRODUCTS",
  "GENERAL_TIPS",
  "HEALTH_AWARE",
]);
export type RecommendationCategory = z.infer<typeof RecommendationCategory>;

/**
 * Every recommendation shown to a user must carry this evidence envelope.
 * `type` distinguishes a directly-sourced FACT from an AI_INTERPRETATION so
 * the client can render appropriate provenance UI and never present an
 * AI-generated conclusion as a verified fact.
 */
export const Evidence = z.object({
  id: z.string(),
  entityId: z.string(),
  category: RecommendationCategory,
  recommendation: z.string(),
  type: EvidenceType,
  reason: z.string(),
  sources: z.array(EvidenceSource).default([]),
  confidence: z.number().min(0).max(1),
  generatedAt: z.string().datetime(),
  expiresAt: z.string().datetime().nullable(),
  modelVersion: z.string().nullable().default(null),
  promptTemplateVersion: z.string().nullable().default(null),
});
export type Evidence = z.infer<typeof Evidence>;

export function isExpired(evidence: Pick<Evidence, "expiresAt">, now: Date = new Date()): boolean {
  if (!evidence.expiresAt) return false;
  return new Date(evidence.expiresAt).getTime() < now.getTime();
}
