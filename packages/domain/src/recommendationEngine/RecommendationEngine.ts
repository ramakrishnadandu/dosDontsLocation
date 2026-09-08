import type {
  AspectSignal,
  CommunityOpinion,
  Deal,
  Evidence,
  EvidenceSource,
  LocationEntity,
  Product,
  RecommendationCategory,
} from "@locaguide/contracts";
import type { AIGenerationRequest, AIGenerationResult } from "@locaguide/providers";
import { newId } from "@locaguide/shared";
import { BRIEFING_DEVELOPER_INSTRUCTIONS, BRIEFING_SYSTEM_INSTRUCTIONS, PROMPT_TEMPLATE_VERSION } from "./prompts";

/**
 * Only the ability to generate is required here - both a single AIProvider
 * and an AIRouter (which fans out to multiple providers with fallback)
 * satisfy this, so the engine works with either.
 */
export interface AIGenerator {
  generate(request: AIGenerationRequest): Promise<AIGenerationResult>;
}

export interface RecommendationInput {
  entity: LocationEntity;
  aspectSignals: AspectSignal[];
  communityOpinions: CommunityOpinion[];
  products?: Product[];
  deals?: Deal[];
  aiProvider?: AIGenerator;
  now?: Date;
}

const REVIEW_SIGNAL_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const AI_INTERPRETATION_TTL_MS = 24 * 60 * 60 * 1000;
const MIN_MENTIONS_FOR_SIGNAL = 3;

type DraftEvidence = Omit<Evidence, "id" | "entityId" | "generatedAt">;

/**
 * Deterministic, evidence-grounded recommendation engine (section 43).
 * Every output item carries its evidence trail and a FACT / REVIEW_SIGNAL /
 * COMMUNITY_OPINION / AI_INTERPRETATION type that is never blurred (section 8).
 *
 * Only the optional GENERAL_TIPS briefing paragraph is produced by an AI
 * provider, and even then it is only allowed to rephrase the evidence this
 * engine already computed deterministically - never raw review text, and
 * never anything outside the evidence payload it is given.
 */
export class RecommendationEngine {
  async generate(input: RecommendationInput): Promise<Evidence[]> {
    const now = input.now ?? new Date();
    const drafts: DraftEvidence[] = [
      ...this.factBasedDo(input.entity),
      ...this.reviewSignalItems(input.aspectSignals, now),
      ...this.communityTips(input.communityOpinions),
      ...this.mustSee(input.entity),
      ...this.products(input.products ?? [], input.deals ?? []),
      ...this.spending(input.products ?? [], input.deals ?? [], now),
      ...this.healthAware(input.entity, input.aspectSignals, now),
    ];

    if (input.aiProvider) {
      const briefing = await this.briefing(input.entity, drafts, input.aiProvider, now);
      if (briefing) drafts.push(briefing);
    }

    return drafts.map((d) => ({
      ...d,
      id: newId(),
      entityId: input.entity.id,
      generatedAt: now.toISOString(),
    }));
  }

  private factBasedDo(entity: LocationEntity): DraftEvidence[] {
    const items: DraftEvidence[] = [];
    if (entity.accessibility.length > 0) {
      items.push({
        category: "DO",
        recommendation: `Accessibility features available: ${entity.accessibility.join(", ")}.`,
        type: "FACT",
        reason: "Reported by the location provider.",
        sources: [{ provider: entity.sourceProvider, evidenceType: "FACT", referenceId: entity.id }],
        confidence: 1,
        expiresAt: null,
        modelVersion: null,
        promptTemplateVersion: null,
      });
    }
    return items;
  }

  private reviewSignalItems(signals: AspectSignal[], now: Date): DraftEvidence[] {
    const items: DraftEvidence[] = [];
    for (const signal of signals) {
      if (signal.totalMentions < MIN_MENTIONS_FOR_SIGNAL) continue;
      const net = signal.positiveMentions - signal.negativeMentions;
      const source: EvidenceSource = {
        provider: "review_engine",
        evidenceType: "REVIEW_SIGNAL",
        count: signal.totalMentions,
        observedAt: signal.computedAt,
      };
      const expiresAt = new Date(now.getTime() + REVIEW_SIGNAL_TTL_MS).toISOString();
      const aspectLabel = signal.aspect.toLowerCase().replace(/_/g, " ");
      const window = this.windowQualifier(signal.timeWindow);

      if (net > 0) {
        items.push({
          category: "DO",
          recommendation: `Reviewers frequently mention a positive experience with ${aspectLabel}.`,
          type: "REVIEW_SIGNAL",
          reason: `${signal.positiveMentions} of ${signal.totalMentions} ${window} review signals about ${aspectLabel} were positive.`,
          sources: [source],
          confidence: signal.confidence,
          expiresAt,
          modelVersion: null,
          promptTemplateVersion: null,
        });
      } else if (this.isWatchAspect(signal.aspect) && signal.negativeMentions > signal.positiveMentions) {
        items.push({
          category: "WATCH",
          recommendation: this.watchPhrasing(aspectLabel, signal.timeWindow),
          type: "REVIEW_SIGNAL",
          reason: `${signal.negativeMentions} of ${signal.totalMentions} ${window} review signals about ${aspectLabel} were negative.`,
          sources: [source],
          confidence: signal.confidence,
          expiresAt,
          modelVersion: null,
          promptTemplateVersion: null,
        });
      } else if (net < 0) {
        items.push({
          category: "CONSIDER",
          recommendation: `Some visitors report concerns about ${aspectLabel}. Consider checking recent details before you go.`,
          type: "REVIEW_SIGNAL",
          reason: `${signal.negativeMentions} of ${signal.totalMentions} ${window} review signals about ${aspectLabel} were negative.`,
          sources: [source],
          confidence: signal.confidence,
          expiresAt,
          modelVersion: null,
          promptTemplateVersion: null,
        });
      }
    }
    return items;
  }

  /**
   * Section 44 (Temporal Intelligence): never let older review data imply
   * current conditions without qualification. Real providers (e.g. Google's
   * API caps us at 5 reviews per place, sampled from its whole history) will
   * rarely have any signal within the last 30 days, so the caller may pass
   * a broader window - when it does, the phrasing below says so explicitly
   * rather than silently presenting old signal as if it were recent.
   */
  private windowQualifier(window: AspectSignal["timeWindow"]): string {
    switch (window) {
      case "recent":
        return "recent";
      case "quarter":
        return "the last 3 months of";
      case "year":
        return "the last year of";
      case "all_time":
        return "all available";
    }
  }

  private isWatchAspect(aspect: AspectSignal["aspect"]): boolean {
    return ["PARKING", "CROWDING", "WAITING_TIME", "SAFETY", "NOISE"].includes(aspect);
  }

  private watchPhrasing(aspectLabel: string, window: AspectSignal["timeWindow"]): string {
    const reviewerQualifier = window === "recent" ? "recent reviewers" : "reviewers";
    if (aspectLabel === "safety") {
      return "Some reviewers mention general personal-security awareness. This reflects reviewer sentiment, not a verified incident report.";
    }
    return `${aspectLabel[0]?.toUpperCase()}${aspectLabel.slice(1)} is frequently reported as an inconvenience by ${reviewerQualifier}. Consider planning around this.`;
  }

  private communityTips(opinions: CommunityOpinion[]): DraftEvidence[] {
    return opinions
      .filter((o) => o.status === "ACTIVE" || o.status === "EDITED")
      .flatMap((o) => o.tips.map((tip) => ({ opinion: o, tip })))
      .slice(0, 5)
      .map(({ opinion, tip }) => ({
        category: "GENERAL_TIPS" as RecommendationCategory,
        recommendation: tip,
        type: "COMMUNITY_OPINION" as const,
        reason: "Submitted by a LocaGuide community member.",
        sources: [
          {
            provider: "community",
            evidenceType: "COMMUNITY_OPINION" as const,
            count: 1,
            referenceId: opinion.id,
            observedAt: opinion.createdAt,
          },
        ],
        confidence: opinion.verifiedVisit ? 0.7 : 0.5,
        expiresAt: null,
        modelVersion: null,
        promptTemplateVersion: null,
      }));
  }

  private mustSee(entity: LocationEntity): DraftEvidence[] {
    if (entity.category !== "TOURIST_ATTRACTION") return [];
    if (!entity.rating || !entity.reviewCount) return [];
    if (entity.rating < 4.5 || entity.reviewCount < 100) return [];
    return [
      {
        category: "MUST_SEE",
        recommendation: `${entity.name} is highly rated (${entity.rating}/5 from ${entity.reviewCount} reviews).`,
        type: "FACT",
        reason: "Shown because the provider-reported rating and review volume both exceed the must-see threshold.",
        sources: [{ provider: entity.sourceProvider, evidenceType: "FACT", referenceId: entity.id }],
        confidence: 0.9,
        expiresAt: null,
        modelVersion: null,
        promptTemplateVersion: null,
      },
    ];
  }

  /**
   * PRODUCTS category (section 43). Only ever lists products a provider
   * has explicitly confirmed are associated with this entity (see
   * ProductProvider#getProductsForEntity) - never products merely in a
   * "similar" category, which would misrepresent what's actually sold
   * here (section 15/42, never fabricate product/seller information).
   */
  private products(products: Product[], deals: Deal[]): DraftEvidence[] {
    return products.map((product) => {
      const activeDeal = deals.find(
        (d) => d.productId === product.id && new Date(d.validFrom) <= new Date() && new Date() <= new Date(d.validUntil),
      );
      const priceText =
        product.price != null
          ? `${product.currency ?? ""} ${activeDeal ? activeDeal.price : product.price}`.trim()
          : null;
      const ratingText = product.rating != null ? ` · ★${product.rating}` : "";
      const dealText = activeDeal?.discountPercent ? ` (${activeDeal.discountPercent}% off)` : "";

      return {
        category: "PRODUCTS" as RecommendationCategory,
        recommendation: `${product.title}${product.brand ? ` by ${product.brand}` : ""}${
          priceText ? ` - ${priceText}${dealText}` : ""
        }${ratingText}.`,
        type: "FACT",
        reason: "Reported by the product provider as associated with this location.",
        sources: [{ provider: product.source, evidenceType: "FACT", referenceId: product.id }],
        confidence: 1,
        expiresAt: null,
        modelVersion: null,
        promptTemplateVersion: null,
      };
    });
  }

  private spending(products: Product[], deals: Deal[], now: Date): DraftEvidence[] {
    const items: DraftEvidence[] = [];
    for (const deal of deals) {
      const isActive = new Date(deal.validFrom) <= now && now <= new Date(deal.validUntil);
      if (!isActive) continue;
      const product = products.find((p) => p.id === deal.productId);
      items.push({
        category: "SPENDING",
        recommendation: `${product?.title ?? "A product"} is available at ${deal.merchant} for ${deal.currency} ${deal.price}${
          deal.discountPercent ? ` (${deal.discountPercent}% off)` : ""
        }.`,
        type: "FACT",
        reason: "Verified active deal from an approved provider.",
        sources: [
          {
            provider: deal.source,
            evidenceType: "FACT",
            referenceId: deal.id,
            observedAt: deal.verifiedAt,
          },
        ],
        confidence: 1,
        expiresAt: deal.validUntil,
        modelVersion: null,
        promptTemplateVersion: null,
      });
    }
    return items;
  }

  private healthAware(entity: LocationEntity, signals: AspectSignal[], now: Date): DraftEvidence[] {
    const relevant = ["HOSPITAL", "PHARMACY", "RESTAURANT"];
    if (!relevant.includes(entity.category)) return [];
    const cleanliness = signals.find((s) => s.aspect === "CLEANLINESS");
    if (!cleanliness || cleanliness.totalMentions < MIN_MENTIONS_FOR_SIGNAL) return [];

    const net = cleanliness.positiveMentions - cleanliness.negativeMentions;
    return [
      {
        category: "HEALTH_AWARE",
        recommendation:
          net >= 0
            ? "Community and review signals generally describe this location as clean. This is general informational guidance, not a health inspection result."
            : "Some reviewers raise cleanliness/hygiene concerns. This reflects reviewer experience, not an official health inspection.",
        type: "REVIEW_SIGNAL",
        reason: `${cleanliness.totalMentions} ${this.windowQualifier(cleanliness.timeWindow)} review signals mention cleanliness.`,
        sources: [
          {
            provider: "review_engine",
            evidenceType: "REVIEW_SIGNAL",
            count: cleanliness.totalMentions,
            observedAt: cleanliness.computedAt,
          },
        ],
        confidence: cleanliness.confidence,
        expiresAt: new Date(now.getTime() + REVIEW_SIGNAL_TTL_MS).toISOString(),
        modelVersion: null,
        promptTemplateVersion: null,
      },
    ];
  }

  private async briefing(
    entity: LocationEntity,
    grounded: DraftEvidence[],
    aiProvider: AIGenerator,
    now: Date,
  ): Promise<DraftEvidence | null> {
    const items = grounded.map((d) => ({ category: d.category, text: d.recommendation, confidence: d.confidence }));
    try {
      const result = await aiProvider.generate({
        systemInstructions: BRIEFING_SYSTEM_INSTRUCTIONS,
        developerInstructions: BRIEFING_DEVELOPER_INSTRUCTIONS,
        evidence: { entityName: entity.name, items },
        responseSchemaName: "briefing_summary_v1",
      });
      const parsed = JSON.parse(result.outputText) as { summary?: unknown; confidence?: unknown };
      if (typeof parsed.summary !== "string" || typeof parsed.confidence !== "number") return null;
      if (parsed.confidence < 0 || parsed.confidence > 1) return null;

      return {
        category: "GENERAL_TIPS",
        recommendation: parsed.summary,
        type: "AI_INTERPRETATION",
        reason: "AI-synthesized summary of the evidence above. Not independently verified.",
        sources: items.map(() => ({ provider: "recommendation_engine", evidenceType: "AI_INTERPRETATION" as const, count: 1 })),
        confidence: parsed.confidence,
        expiresAt: new Date(now.getTime() + AI_INTERPRETATION_TTL_MS).toISOString(),
        modelVersion: result.model,
        promptTemplateVersion: PROMPT_TEMPLATE_VERSION,
      };
    } catch {
      // AI synthesis is best-effort only; never block the rest of the briefing.
      return null;
    }
  }
}
