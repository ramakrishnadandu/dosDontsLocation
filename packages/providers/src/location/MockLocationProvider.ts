import type { LocationEntity, NearbySearchQuery, TextSearchQuery } from "@locaguide/contracts";
import type { LocationProvider } from "./LocationProvider";
import { DEMO_ENTITIES } from "./demoData";
import { distanceMeters } from "./geo";

/**
 * Deterministic, always-available location provider backed by realistic
 * demo data. Used automatically whenever no real provider is configured,
 * and in tests / CI.
 */
export class MockLocationProvider implements LocationProvider {
  readonly name = "mock";
  readonly isConfigured = true;

  private readonly entities: LocationEntity[];

  constructor(entities: LocationEntity[] = DEMO_ENTITIES) {
    this.entities = entities;
  }

  async searchNearby(query: NearbySearchQuery): Promise<LocationEntity[]> {
    return this.entities
      .filter((e) => !query.category || e.category === query.category)
      .map((e) => ({ entity: e, distance: distanceMeters(query.location, e.location) }))
      .filter((x) => x.distance <= query.radiusMeters)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, query.limit)
      .map((x) => x.entity);
  }

  async searchByText(query: TextSearchQuery): Promise<LocationEntity[]> {
    const needle = query.query.trim().toLowerCase();
    return this.entities
      .filter((e) => !query.category || e.category === query.category)
      .filter(
        (e) =>
          e.name.toLowerCase().includes(needle) ||
          (e.address ?? "").toLowerCase().includes(needle) ||
          e.category.toLowerCase().includes(needle),
      )
      .slice(0, query.limit);
  }

  async getById(id: string): Promise<LocationEntity | null> {
    return this.entities.find((e) => e.id === id) ?? null;
  }
}
