import type { RawReview } from "@locaguide/contracts";
import type { ReviewProvider } from "./ReviewProvider";
import { DEMO_REVIEWS } from "./demoReviews";

export class MockReviewProvider implements ReviewProvider {
  readonly name = "mock";
  readonly isConfigured = true;

  constructor(private readonly reviews: RawReview[] = DEMO_REVIEWS) {}

  async getReviewsForEntity(entityId: string, limit = 100): Promise<RawReview[]> {
    return this.reviews.filter((r) => r.entityId === entityId).slice(0, limit);
  }
}
