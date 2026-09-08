import type { LocationEntity, NearbySearchQuery, TextSearchQuery } from "@locaguide/contracts";

/**
 * Provider-agnostic interface for resolving real-world places.
 * Implementations: MockLocationProvider (always available),
 * GooglePlacesProvider (requires GOOGLE_PLACES_API_KEY).
 *
 * Never scrape a provider's website. Respect attribution requirements
 * (see `attribution` field on LocationEntity) and API terms.
 */
export interface LocationProvider {
  readonly name: string;
  readonly isConfigured: boolean;

  searchNearby(query: NearbySearchQuery): Promise<LocationEntity[]>;
  searchByText(query: TextSearchQuery): Promise<LocationEntity[]>;
  getById(id: string): Promise<LocationEntity | null>;
}
