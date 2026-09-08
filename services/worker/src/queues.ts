/**
 * Job queue names (section 25). Two are fully implemented as a reference
 * (review_analysis, recommendation_generation); the rest are registered so
 * the async architecture and monitoring surface exist end-to-end, with
 * their processors intentionally left as documented TODOs pending the
 * corresponding external integration (see docs/architecture.md#jobs).
 */
export const QUEUE_NAMES = {
  reviewIngestion: "review_ingestion",
  reviewAnalysis: "review_analysis",
  productSync: "product_sync",
  locationSync: "location_sync",
  aiSummary: "ai_summary",
  recommendationGeneration: "recommendation_generation",
  moderation: "moderation",
  imageProcessing: "image_processing",
  analytics: "analytics",
  notifications: "notifications",
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

export interface ReviewAnalysisJobData {
  entityId: string;
}

export interface RecommendationGenerationJobData {
  entityId: string;
  userId?: string;
}
