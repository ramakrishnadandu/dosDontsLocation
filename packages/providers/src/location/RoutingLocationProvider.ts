import type { LocationEntity, NearbySearchQuery, TextSearchQuery } from "@locaguide/contracts";
import type { LocationProvider } from "./LocationProvider";

/**
 * Composes a mock provider with an optional real one, so enabling a real
 * credential (e.g. GOOGLE_PLACES_API_KEY) augments demo mode instead of
 * replacing it wholesale.
 *
 * This exists because entity ids are provider-tagged (mock demo entities
 * are always "demo-*", real Google entities are always "google:*" - see
 * demoData.ts and GooglePlacesProvider#toEntity), and once real data has
 * been fetched for a location, other parts of the system (community
 * opinions, saved locations, evidence, audit trails) keep referencing that
 * exact id. If the LocationProvider selection were all-or-nothing, turning
 * on a real credential would silently break every existing reference to a
 * demo entity (getById would 404) - this router keeps both resolvable.
 */
export class RoutingLocationProvider implements LocationProvider {
  readonly name = "routing";
  readonly isConfigured = true;

  constructor(
    private readonly mock: LocationProvider,
    private readonly real: LocationProvider | null,
  ) {}

  async getById(id: string): Promise<LocationEntity | null> {
    if (id.startsWith("demo-")) return this.mock.getById(id);
    if (this.real) return this.real.getById(id);
    return this.mock.getById(id);
  }

  async searchNearby(query: NearbySearchQuery): Promise<LocationEntity[]> {
    if (this.real) {
      try {
        const results = await this.real.searchNearby(query);
        if (results.length > 0) return results;
      } catch {
        // Real provider unavailable/erroring - degrade to mock rather than
        // failing the whole request (section 53, Failure Handling).
      }
    }
    return this.mock.searchNearby(query);
  }

  async searchByText(query: TextSearchQuery): Promise<LocationEntity[]> {
    if (this.real) {
      try {
        const results = await this.real.searchByText(query);
        if (results.length > 0) return results;
      } catch {
        // See searchNearby - degrade to mock rather than failing outright.
      }
    }
    return this.mock.searchByText(query);
  }
}
