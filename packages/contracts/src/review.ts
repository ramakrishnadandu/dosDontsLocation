import { z } from "zod";

export const RawReview = z.object({
  id: z.string(),
  entityId: z.string(),
  sourceProvider: z.string(),
  sourceReviewId: z.string(),
  authorDisplayName: z.string().nullable(),
  rating: z.number().min(0).max(5).nullable(),
  text: z.string(),
  language: z.string().nullable(),
  publishedAt: z.string().datetime(),
  fetchedAt: z.string().datetime(),
});
export type RawReview = z.infer<typeof RawReview>;

export const ReviewAspect = z.enum([
  "PARKING",
  "CLEANLINESS",
  "STAFF",
  "FOOD",
  "PRICE",
  "SERVICE",
  "CROWDING",
  "NOISE",
  "LOCATION",
  "ROOMS",
  "ACCESSIBILITY",
  "WAITING_TIME",
  "SAFETY",
  "AMBIENCE",
]);
export type ReviewAspect = z.infer<typeof ReviewAspect>;

export const Sentiment = z.enum(["POSITIVE", "NEGATIVE", "NEUTRAL"]);
export type Sentiment = z.infer<typeof Sentiment>;

/**
 * Aggregated signal for one aspect (e.g. "parking") over a time window.
 * Produced by the review-engine pipeline; never sent raw review text
 * straight to the LLM.
 */
export const AspectSignal = z.object({
  entityId: z.string(),
  aspect: ReviewAspect,
  positiveMentions: z.number().int().nonnegative(),
  negativeMentions: z.number().int().nonnegative(),
  neutralMentions: z.number().int().nonnegative(),
  totalMentions: z.number().int().nonnegative(),
  timeWindow: z.enum(["recent", "quarter", "year", "all_time"]),
  confidence: z.number().min(0).max(1),
  computedAt: z.string().datetime(),
});
export type AspectSignal = z.infer<typeof AspectSignal>;

export const AnalyzedReview = z.object({
  reviewId: z.string(),
  entityId: z.string(),
  language: z.string(),
  normalizedText: z.string(),
  isSpam: z.boolean(),
  isDuplicate: z.boolean(),
  duplicateOfReviewId: z.string().nullable(),
  overallSentiment: Sentiment,
  aspects: z.array(
    z.object({
      aspect: ReviewAspect,
      sentiment: Sentiment,
      snippet: z.string(),
    }),
  ),
  analyzedAt: z.string().datetime(),
});
export type AnalyzedReview = z.infer<typeof AnalyzedReview>;
