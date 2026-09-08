import type { RawReview } from "@locaguide/contracts";

/**
 * Provider-agnostic interface for fetching raw reviews for a location.
 * Raw reviews from ANY provider must flow through the review-engine
 * pipeline (language detection -> normalization -> spam/duplicate
 * detection -> sentiment -> aspect extraction) before being used as
 * evidence. Never pass raw review text directly to an LLM.
 */
export interface ReviewProvider {
  readonly name: string;
  readonly isConfigured: boolean;

  getReviewsForEntity(entityId: string, limit?: number): Promise<RawReview[]>;
}
