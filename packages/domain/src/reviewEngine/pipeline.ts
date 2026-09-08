import type { AnalyzedReview, AspectSignal, RawReview, ReviewAspect } from "@locaguide/contracts";
import { extractAspects } from "./aspectExtraction";
import { findDuplicates } from "./duplicateDetection";
import { detectLanguage, normalizeText } from "./normalize";
import { scoreSentiment } from "./sentiment";
import { scoreSpam } from "./spamDetection";

const SPAM_THRESHOLD = 0.6;

const RECENT_WINDOW_DAYS = 30;
const QUARTER_WINDOW_DAYS = 90;
const YEAR_WINDOW_DAYS = 365;

/**
 * The full review-intelligence pipeline (section 7 of the product spec):
 * raw review -> language detect -> normalize -> spam detect -> duplicate
 * detect -> sentiment -> aspect extraction -> time-windowed aggregation.
 *
 * Output is what the recommendation engine consumes as REVIEW_SIGNAL
 * evidence - never raw review text.
 */
export function analyzeReviews(reviews: RawReview[]): AnalyzedReview[] {
  const duplicates = findDuplicates(
    reviews.map((r) => ({ id: r.id, text: r.text, authorDisplayName: r.authorDisplayName })),
  );

  return reviews.map((review) => {
    const normalizedText = normalizeText(review.text);
    const language = review.language ?? detectLanguage(normalizedText);
    const spam = scoreSpam(normalizedText);
    const isDuplicate = duplicates.has(review.id);

    return {
      reviewId: review.id,
      entityId: review.entityId,
      language,
      normalizedText,
      isSpam: spam.score >= SPAM_THRESHOLD,
      isDuplicate,
      duplicateOfReviewId: duplicates.get(review.id) ?? null,
      overallSentiment: scoreSentiment(normalizedText).sentiment,
      aspects: extractAspects(normalizedText),
      analyzedAt: new Date().toISOString(),
    } satisfies AnalyzedReview;
  });
}

function withinDays(publishedAt: string, days: number, now: Date): boolean {
  const ageMs = now.getTime() - new Date(publishedAt).getTime();
  return ageMs <= days * 24 * 60 * 60 * 1000;
}

/**
 * Aggregates analyzed reviews into per-aspect signals for a given time
 * window. Spam and duplicate reviews are excluded so they cannot inflate
 * or distort the signal (section 17, Safety/Moderation).
 *
 * confidence is a simple, documented function of sample size: it grows
 * toward 1.0 as total_mentions increases, capped at 25 mentions. This is a
 * transparent heuristic, not a statistical guarantee.
 */
export function computeAspectSignals(
  entityId: string,
  reviews: RawReview[],
  analyzed: AnalyzedReview[],
  timeWindow: AspectSignal["timeWindow"],
  now: Date = new Date(),
): AspectSignal[] {
  const publishedAtByReviewId = new Map(reviews.map((r) => [r.id, r.publishedAt]));
  const windowDays =
    timeWindow === "recent"
      ? RECENT_WINDOW_DAYS
      : timeWindow === "quarter"
        ? QUARTER_WINDOW_DAYS
        : timeWindow === "year"
          ? YEAR_WINDOW_DAYS
          : Infinity;

  const counts = new Map<ReviewAspect, { positive: number; negative: number; neutral: number }>();

  for (const item of analyzed) {
    if (item.isSpam || item.isDuplicate) continue;
    const publishedAt = publishedAtByReviewId.get(item.reviewId);
    if (!publishedAt || !withinDays(publishedAt, windowDays, now)) continue;

    for (const mention of item.aspects) {
      const bucket = counts.get(mention.aspect) ?? { positive: 0, negative: 0, neutral: 0 };
      if (mention.sentiment === "POSITIVE") bucket.positive += 1;
      else if (mention.sentiment === "NEGATIVE") bucket.negative += 1;
      else bucket.neutral += 1;
      counts.set(mention.aspect, bucket);
    }
  }

  return [...counts.entries()].map(([aspect, c]) => {
    const total = c.positive + c.negative + c.neutral;
    return {
      entityId,
      aspect,
      positiveMentions: c.positive,
      negativeMentions: c.negative,
      neutralMentions: c.neutral,
      totalMentions: total,
      timeWindow,
      confidence: Number(Math.min(1, total / 25).toFixed(2)),
      computedAt: now.toISOString(),
    } satisfies AspectSignal;
  });
}
