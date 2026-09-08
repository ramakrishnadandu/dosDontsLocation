import { MockLocationProvider } from "./MockLocationProvider";
import { RoutingLocationProvider } from "./RoutingLocationProvider";
import type { LocationProvider } from "./LocationProvider";
import type { LocationEntity, NearbySearchQuery, TextSearchQuery } from "@locaguide/contracts";

function fakeRealEntity(id: string): LocationEntity {
  return {
    id,
    tenantId: null,
    name: "Real Place",
    category: "STORE",
    secondaryCategories: [],
    address: null,
    location: { latitude: 1, longitude: 1 },
    rating: null,
    reviewCount: null,
    openingHours: [],
    website: null,
    phone: null,
    accessibility: [],
    sourceProvider: "google_places",
    sourceProviderId: id,
    attribution: "Place information provided by Google",
    isDemoData: false,
    fetchedAt: new Date().toISOString(),
  };
}

class StubRealProvider implements LocationProvider {
  readonly name = "google_places";
  readonly isConfigured = true;
  searchNearbyResult: LocationEntity[] = [];
  searchByTextResult: LocationEntity[] = [];
  shouldThrow = false;

  async getById(id: string): Promise<LocationEntity | null> {
    if (this.shouldThrow) throw new Error("boom");
    return fakeRealEntity(id);
  }
  async searchNearby(_query: NearbySearchQuery): Promise<LocationEntity[]> {
    if (this.shouldThrow) throw new Error("boom");
    return this.searchNearbyResult;
  }
  async searchByText(_query: TextSearchQuery): Promise<LocationEntity[]> {
    if (this.shouldThrow) throw new Error("boom");
    return this.searchByTextResult;
  }
}

describe("RoutingLocationProvider", () => {
  it("resolves demo- ids via the mock provider even when a real provider is configured", async () => {
    const real = new StubRealProvider();
    const router = new RoutingLocationProvider(new MockLocationProvider(), real);
    const entity = await router.getById("demo-mall-1");
    expect(entity?.name).toBe("Riverside Central Mall");
    expect(entity?.isDemoData).toBe(true);
  });

  it("resolves non-demo ids via the real provider when configured", async () => {
    const real = new StubRealProvider();
    const router = new RoutingLocationProvider(new MockLocationProvider(), real);
    const entity = await router.getById("google:abc123");
    expect(entity?.sourceProvider).toBe("google_places");
  });

  it("falls back to mock getById when no real provider is configured", async () => {
    const router = new RoutingLocationProvider(new MockLocationProvider(), null);
    const entity = await router.getById("google:abc123");
    expect(entity).toBeNull();
  });

  it("prefers real search results when available", async () => {
    const real = new StubRealProvider();
    real.searchByTextResult = [fakeRealEntity("google:xyz")];
    const router = new RoutingLocationProvider(new MockLocationProvider(), real);
    const results = await router.searchByText({ query: "anything", limit: 20 });
    expect(results).toHaveLength(1);
    expect(results[0]?.sourceProvider).toBe("google_places");
  });

  it("falls back to mock search results when the real provider returns nothing", async () => {
    const real = new StubRealProvider();
    real.searchByTextResult = [];
    const router = new RoutingLocationProvider(new MockLocationProvider(), real);
    const results = await router.searchByText({ query: "fort", limit: 20 });
    expect(results.some((e) => e.isDemoData)).toBe(true);
  });

  it("falls back to mock search results when the real provider throws", async () => {
    const real = new StubRealProvider();
    real.shouldThrow = true;
    const router = new RoutingLocationProvider(new MockLocationProvider(), real);
    const results = await router.searchByText({ query: "fort", limit: 20 });
    expect(results.some((e) => e.isDemoData)).toBe(true);
  });
});
