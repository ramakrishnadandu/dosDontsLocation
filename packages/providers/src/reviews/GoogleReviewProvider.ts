import type { RawReview } from "@locaguide/contracts";
import { ProviderError } from "@locaguide/shared";
import type { ReviewProvider } from "./ReviewProvider";

/**
 * NOT executed/tested in this environment (no credential available).
 *
 * IMPORTANT LIMITATION (must be respected, not worked around): the Google
 * Places API only returns up to 5 editorial reviews per place, and its
 * Terms of Service prohibit bulk-scraping or caching full review corpora
 * beyond the documented caching window. This adapter therefore only ever
 * returns that small sample - it must NOT be used as the sole review
 * source for aspect-signal statistics; combine with CommunityReviewProvider.
 */
export class GoogleReviewProvider implements ReviewProvider {
  readonly name = "google_places_reviews";

  constructor(private readonly apiKey: string | undefined) {}

  get isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  async getReviewsForEntity(entityId: string): Promise<RawReview[]> {
    if (!this.apiKey) {
      throw new ProviderError(this.name, "GOOGLE_PLACES_API_KEY is not configured.");
    }
    const placeId = entityId.startsWith("google:") ? entityId.slice("google:".length) : entityId;
    const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
      headers: {
        "X-Goog-Api-Key": this.apiKey,
        "X-Goog-FieldMask": "reviews",
      },
    });
    if (!res.ok) {
      throw new ProviderError(this.name, `Places API request failed with status ${res.status}`);
    }
    const data = (await res.json()) as {
      reviews?: Array<{
        name: string;
        authorAttribution?: { displayName?: string };
        rating?: number;
        text?: { text?: string };
        publishTime?: string;
      }>;
    };
    return (data.reviews ?? []).map((r) => ({
      id: `google:${r.name}`,
      entityId,
      sourceProvider: this.name,
      sourceReviewId: r.name,
      authorDisplayName: r.authorAttribution?.displayName ?? null,
      rating: r.rating ?? null,
      text: r.text?.text ?? "",
      language: null,
      publishedAt: r.publishTime ?? new Date().toISOString(),
      fetchedAt: new Date().toISOString(),
    }));
  }
}
