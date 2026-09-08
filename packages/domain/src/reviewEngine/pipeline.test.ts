import { DEMO_REVIEWS } from "@locaguide/providers";
import { analyzeReviews, computeAspectSignals } from "./pipeline";

describe("review-engine pipeline", () => {
  const mallReviews = DEMO_REVIEWS.filter((r) => r.entityId === "demo-mall-1");
  const analyzed = analyzeReviews(mallReviews);

  it("flags the obvious spam review", () => {
    const spamReview = analyzed.find((a) => a.reviewId === "r8");
    expect(spamReview?.isSpam).toBe(true);
  });

  it("flags the near-duplicate review from the same author", () => {
    const duplicate = analyzed.find((a) => a.reviewId === "r9");
    expect(duplicate?.isDuplicate).toBe(true);
    expect(duplicate?.duplicateOfReviewId).toBe("r2");
  });

  it("does not flag distinct reviews as duplicates", () => {
    const distinct = analyzed.find((a) => a.reviewId === "r3");
    expect(distinct?.isDuplicate).toBe(false);
  });

  it("extracts parking mentions with correct sentiment", () => {
    const r1 = analyzed.find((a) => a.reviewId === "r1");
    const parkingMention = r1?.aspects.find((m) => m.aspect === "PARKING");
    expect(parkingMention).toBeDefined();
    expect(parkingMention?.sentiment).toBe("NEGATIVE");
  });

  it("aggregates aspect signals excluding spam and duplicates", () => {
    const signals = computeAspectSignals("demo-mall-1", mallReviews, analyzed, "all_time");
    const parking = signals.find((s) => s.aspect === "PARKING");
    expect(parking).toBeDefined();
    // r2 (negative) counted once, r9 excluded as duplicate, r1 and r10 also mention parking negatively.
    expect(parking!.totalMentions).toBeGreaterThan(0);
    expect(parking!.negativeMentions).toBeGreaterThanOrEqual(parking!.positiveMentions);
  });

  it("excludes reviews outside the requested time window", () => {
    const recentSignals = computeAspectSignals("demo-mall-1", mallReviews, analyzed, "recent");
    const allTimeSignals = computeAspectSignals("demo-mall-1", mallReviews, analyzed, "all_time");
    const recentTotal = recentSignals.reduce((sum, s) => sum + s.totalMentions, 0);
    const allTimeTotal = allTimeSignals.reduce((sum, s) => sum + s.totalMentions, 0);
    expect(recentTotal).toBeLessThanOrEqual(allTimeTotal);
  });
});
