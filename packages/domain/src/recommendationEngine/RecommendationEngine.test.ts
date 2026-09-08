import { DEMO_DEALS, DEMO_ENTITIES, DEMO_PRODUCTS, MockAIProvider } from "@locaguide/providers";
import { analyzeReviews, computeAspectSignals } from "../reviewEngine/pipeline";
import { DEMO_REVIEWS } from "@locaguide/providers";
import { RecommendationEngine } from "./RecommendationEngine";

describe("RecommendationEngine", () => {
  const mall = DEMO_ENTITIES.find((e) => e.id === "demo-mall-1")!;
  const mallReviews = DEMO_REVIEWS.filter((r) => r.entityId === "demo-mall-1");
  const analyzed = analyzeReviews(mallReviews);
  const signals = computeAspectSignals("demo-mall-1", mallReviews, analyzed, "all_time");

  it("produces a WATCH item for parking backed by review-signal evidence, never presented as a fact", async () => {
    const engine = new RecommendationEngine();
    const evidence = await engine.generate({ entity: mall, aspectSignals: signals, communityOpinions: [] });

    const parkingWatch = evidence.find((e) => e.category === "WATCH" && e.recommendation.toLowerCase().includes("parking"));
    expect(parkingWatch).toBeDefined();
    expect(parkingWatch!.type).toBe("REVIEW_SIGNAL");
    expect(parkingWatch!.sources.length).toBeGreaterThan(0);
    expect(parkingWatch!.confidence).toBeGreaterThan(0);
    expect(parkingWatch!.confidence).toBeLessThanOrEqual(1);
  });

  it("every recommendation carries at least one evidence source", async () => {
    const engine = new RecommendationEngine();
    const evidence = await engine.generate({ entity: mall, aspectSignals: signals, communityOpinions: [] });
    for (const item of evidence) {
      expect(item.sources.length).toBeGreaterThan(0);
    }
  });

  it("produces an AI_INTERPRETATION briefing item that never fabricates beyond the evidence, using the mock provider", async () => {
    const engine = new RecommendationEngine();
    const evidence = await engine.generate({
      entity: mall,
      aspectSignals: signals,
      communityOpinions: [],
      aiProvider: new MockAIProvider(),
    });
    const briefing = evidence.find((e) => e.type === "AI_INTERPRETATION");
    expect(briefing).toBeDefined();
    expect(briefing!.recommendation).toContain(mall.name);
  });

  it("returns the canonical not-available message when there is no evidence at all", async () => {
    const engine = new RecommendationEngine();
    const emptyEntity = { ...mall, accessibility: [] as string[] };
    const evidence = await engine.generate({
      entity: emptyEntity,
      aspectSignals: [],
      communityOpinions: [],
      aiProvider: new MockAIProvider(),
    });
    const briefing = evidence.find((e) => e.type === "AI_INTERPRETATION");
    expect(briefing!.recommendation).toBe("Information not available from the current sources.");
    expect(briefing!.confidence).toBe(0);
  });

  it("never fabricates a SPENDING item when no deals are provided", async () => {
    const engine = new RecommendationEngine();
    const evidence = await engine.generate({ entity: mall, aspectSignals: signals, communityOpinions: [] });
    expect(evidence.some((e) => e.category === "SPENDING")).toBe(false);
  });

  it("never fabricates a PRODUCTS item when no products are associated with the entity", async () => {
    const engine = new RecommendationEngine();
    const evidence = await engine.generate({ entity: mall, aspectSignals: signals, communityOpinions: [] });
    expect(evidence.some((e) => e.category === "PRODUCTS")).toBe(false);
  });

  it("produces a PRODUCTS item, as a FACT, for each product explicitly associated with the entity", async () => {
    const engine = new RecommendationEngine();
    const evidence = await engine.generate({
      entity: mall,
      aspectSignals: signals,
      communityOpinions: [],
      products: DEMO_PRODUCTS,
    });
    const productItems = evidence.filter((e) => e.category === "PRODUCTS");
    expect(productItems).toHaveLength(DEMO_PRODUCTS.length);
    for (const item of productItems) {
      expect(item.type).toBe("FACT");
      expect(item.sources.length).toBeGreaterThan(0);
    }
    expect(productItems.some((e) => e.recommendation.includes("AeroFlow Wireless Headphones"))).toBe(true);
  });

  it("reflects an active deal's discounted price in the PRODUCTS item rather than the original price", async () => {
    const engine = new RecommendationEngine();
    const evidence = await engine.generate({
      entity: mall,
      aspectSignals: signals,
      communityOpinions: [],
      products: DEMO_PRODUCTS,
      deals: DEMO_DEALS,
    });
    const headphones = evidence.find((e) => e.category === "PRODUCTS" && e.recommendation.includes("AeroFlow"));
    expect(headphones!.recommendation).toContain("1999");
    expect(headphones!.recommendation).toContain("20% off");
  });
});
