import type { RawReview } from "@locaguide/contracts";
import type { ReviewProvider } from "@locaguide/providers";
import type { PrismaClient } from "@locaguide/db";

/**
 * Adapts LocaGuide's own community opinions into the ReviewProvider shape
 * so the same review-engine pipeline (aspect extraction, sentiment, etc.)
 * can treat community text and third-party review text uniformly (section
 * 9 - provider-agnostic architecture). Only APPROVED, ACTIVE/EDITED
 * opinions are surfaced.
 */
export class CommunityReviewProvider implements ReviewProvider {
  readonly name = "community";
  readonly isConfigured = true;

  constructor(private readonly prisma: PrismaClient) {}

  async getReviewsForEntity(entityId: string, limit = 200): Promise<RawReview[]> {
    const opinions = await this.prisma.communityOpinion.findMany({
      where: {
        entityId,
        status: { in: ["ACTIVE", "EDITED"] },
        moderationStatus: "APPROVED",
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return opinions.map((o) => {
      const text = [o.title, o.body, ...o.pros, ...o.cons, ...o.tips].filter(Boolean).join(". ");
      return {
        id: `community:${o.id}`,
        entityId,
        sourceProvider: this.name,
        sourceReviewId: o.id,
        authorDisplayName: null,
        rating: o.rating,
        text,
        language: null,
        publishedAt: o.createdAt.toISOString(),
        fetchedAt: new Date().toISOString(),
      } satisfies RawReview;
    });
  }
}
