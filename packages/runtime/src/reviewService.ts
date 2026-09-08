import type { AspectSignal, RawReview } from "@locaguide/contracts";
import { analyzeReviews, computeAspectSignals } from "@locaguide/domain";
import { prisma } from "@locaguide/db";
import { childLogger } from "@locaguide/shared";
import { buildProviderRegistry } from "./registry";

const log = childLogger({ component: "reviewService" });

/**
 * Runs the full review-engine pipeline (section 7) for one entity across
 * every configured review provider (mock + community, and any real
 * provider allowed by policy), and persists the analyzed reviews +
 * aggregated aspect signals.
 *
 * In this reference implementation this runs synchronously on request for
 * demo-scale data; services/worker exposes the same logic as an async job
 * (`review_analysis`) for production-scale ingestion (section 25).
 */
export async function refreshReviewsForEntity(entityId: string): Promise<AspectSignal[]> {
  const { reviewProviders } = buildProviderRegistry();

  const allRaw: RawReview[] = [];
  for (const provider of reviewProviders) {
    if (!provider.isConfigured) continue;
    try {
      const reviews = await provider.getReviewsForEntity(entityId);
      allRaw.push(...reviews);
    } catch (err) {
      // One provider failing (e.g. Google returning 404 for an entity it
      // doesn't recognize, or a transient network error) must never break
      // the whole briefing - degrade gracefully and keep whatever the
      // other providers returned (section 53, Failure Handling).
      log.warn({ provider: provider.name, entityId, err: (err as Error).message }, "Review provider failed; continuing with other providers");
    }
  }

  if (allRaw.length === 0) return [];

  const analyzed = analyzeReviews(allRaw);

  await prisma.$transaction(
    allRaw.map((r, idx) => {
      const a = analyzed[idx];
      return prisma.reviewRecord.upsert({
        where: { sourceProvider_sourceReviewId: { sourceProvider: r.sourceProvider, sourceReviewId: r.sourceReviewId } },
        create: {
          id: r.id,
          entityId: r.entityId,
          sourceProvider: r.sourceProvider,
          sourceReviewId: r.sourceReviewId,
          authorDisplayName: r.authorDisplayName,
          rating: r.rating,
          text: r.text,
          language: a?.language ?? r.language,
          isSpam: a?.isSpam ?? false,
          isDuplicate: a?.isDuplicate ?? false,
          duplicateOfReviewId: a?.duplicateOfReviewId ?? null,
          overallSentiment: a?.overallSentiment ?? null,
          publishedAt: new Date(r.publishedAt),
          analyzedAt: new Date(),
        },
        update: {
          isSpam: a?.isSpam ?? false,
          isDuplicate: a?.isDuplicate ?? false,
          duplicateOfReviewId: a?.duplicateOfReviewId ?? null,
          overallSentiment: a?.overallSentiment ?? null,
          analyzedAt: new Date(),
        },
      });
    }),
  );

  const recentSignals = computeAspectSignals(entityId, allRaw, analyzed, "recent");
  const allTimeSignals = computeAspectSignals(entityId, allRaw, analyzed, "all_time");
  const signals = [...recentSignals, ...allTimeSignals];

  await prisma.$transaction([
    prisma.reviewAspectRecord.deleteMany({ where: { entityId } }),
    ...signals.map((s) =>
      prisma.reviewAspectRecord.create({
        data: {
          entityId: s.entityId,
          aspect: s.aspect,
          positiveMentions: s.positiveMentions,
          negativeMentions: s.negativeMentions,
          neutralMentions: s.neutralMentions,
          totalMentions: s.totalMentions,
          timeWindow: s.timeWindow,
          confidence: s.confidence,
          computedAt: new Date(s.computedAt),
        },
      }),
    ),
  ]);

  return recentSignals;
}

export async function getAspectSignals(
  entityId: string,
  timeWindow: AspectSignal["timeWindow"] = "recent",
): Promise<AspectSignal[]> {
  const rows = await prisma.reviewAspectRecord.findMany({ where: { entityId, timeWindow } });
  if (rows.length === 0) {
    await refreshReviewsForEntity(entityId);
    const refreshed = await prisma.reviewAspectRecord.findMany({ where: { entityId, timeWindow } });
    return refreshed.map(toAspectSignal);
  }
  return rows.map(toAspectSignal);
}

const WINDOW_FALLBACK_ORDER: AspectSignal["timeWindow"][] = ["recent", "quarter", "year", "all_time"];

/**
 * Tries "recent" first, then progressively broader windows, returning the
 * first one with any signal. This matters for providers with a small,
 * capped sample (e.g. Google's API returns at most 5 reviews per place,
 * spread across the place's whole history) - "recent" (30 days) will
 * almost always be empty for those even when good signal exists, so
 * falling back avoids showing "not available" when real evidence is
 * sitting one window out. The recommendation engine still labels the
 * evidence honestly with whichever window actually produced it (section
 * 44, Temporal Intelligence) - this never presents old data as recent.
 */
export async function getBestAvailableAspectSignals(entityId: string): Promise<AspectSignal[]> {
  for (const window of WINDOW_FALLBACK_ORDER) {
    const signals = await getAspectSignals(entityId, window);
    if (signals.length > 0) return signals;
  }
  return [];
}

function toAspectSignal(row: {
  entityId: string;
  aspect: string;
  positiveMentions: number;
  negativeMentions: number;
  neutralMentions: number;
  totalMentions: number;
  timeWindow: string;
  confidence: number;
  computedAt: Date;
}): AspectSignal {
  return {
    entityId: row.entityId,
    aspect: row.aspect as AspectSignal["aspect"],
    positiveMentions: row.positiveMentions,
    negativeMentions: row.negativeMentions,
    neutralMentions: row.neutralMentions,
    totalMentions: row.totalMentions,
    timeWindow: row.timeWindow as AspectSignal["timeWindow"],
    confidence: row.confidence,
    computedAt: row.computedAt.toISOString(),
  };
}
