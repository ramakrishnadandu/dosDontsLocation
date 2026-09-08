import type { LocationEntity, NearbySearchQuery, TextSearchQuery, EntityCategory } from "@locaguide/contracts";
import { ProviderError } from "@locaguide/shared";
import type { LocationProvider } from "./LocationProvider";

/**
 * Real-provider adapter for the Google Places API (New).
 * Requires GOOGLE_PLACES_API_KEY. NOT executed/tested in this environment
 * (no credential available) - implemented against the documented Places API
 * (New) request/response shape. Treat as a reviewed-but-unverified adapter;
 * validate against a real key before relying on it in production.
 *
 * Never scrapes google.com. Uses only the official HTTPS API.
 */
const PLACE_CATEGORY_MAP: Record<EntityCategory, string[]> = {
  SHOPPING_MALL: ["shopping_mall"],
  MARKET: ["market", "supermarket"],
  HOTEL: ["lodging"],
  RESTAURANT: ["restaurant"],
  BANK: ["bank"],
  HOSPITAL: ["hospital"],
  TOURIST_ATTRACTION: ["tourist_attraction"],
  STORE: ["store"],
  PHARMACY: ["pharmacy"],
  AIRPORT: ["airport"],
  RAILWAY_STATION: ["train_station"],
  CINEMA: ["movie_theater"],
  ENTERTAINMENT_VENUE: ["amusement_park", "night_club"],
  UNIVERSITY: ["university"],
  OFFICE: ["point_of_interest"],
  PUBLIC_PLACE: ["point_of_interest"],
  OTHER: [],
};

function mapGoogleTypeToCategory(types: string[]): EntityCategory {
  for (const [category, googleTypes] of Object.entries(PLACE_CATEGORY_MAP) as [EntityCategory, string[]][]) {
    if (googleTypes.some((t) => types.includes(t))) return category;
  }
  return "OTHER";
}

interface GooglePlace {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
  rating?: number;
  userRatingCount?: number;
  types?: string[];
  websiteUri?: string;
  internationalPhoneNumber?: string;
  accessibilityOptions?: Record<string, boolean>;
}

export class GooglePlacesProvider implements LocationProvider {
  readonly name = "google_places";

  constructor(private readonly apiKey: string | undefined) {}

  get isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  private requireApiKey(): string {
    if (!this.apiKey) {
      throw new ProviderError(
        this.name,
        "GOOGLE_PLACES_API_KEY is not configured. Set it in .env or fall back to MockLocationProvider.",
      );
    }
    return this.apiKey;
  }

  private toEntity(place: GooglePlace): LocationEntity {
    return {
      id: `google:${place.id}`,
      tenantId: null,
      name: place.displayName?.text ?? "Unknown",
      category: mapGoogleTypeToCategory(place.types ?? []),
      secondaryCategories: place.types ?? [],
      address: place.formattedAddress ?? null,
      location: {
        latitude: place.location?.latitude ?? 0,
        longitude: place.location?.longitude ?? 0,
      },
      rating: place.rating ?? null,
      reviewCount: place.userRatingCount ?? null,
      openingHours: [],
      website: place.websiteUri ?? null,
      phone: place.internationalPhoneNumber ?? null,
      accessibility: Object.entries(place.accessibilityOptions ?? {})
        .filter(([, v]) => v)
        .map(([k]) => k),
      sourceProvider: this.name,
      sourceProviderId: place.id,
      attribution: "Place information provided by Google",
      isDemoData: false,
      fetchedAt: new Date().toISOString(),
    };
  }

  async searchNearby(query: NearbySearchQuery): Promise<LocationEntity[]> {
    const body = {
      maxResultCount: query.limit,
      locationRestriction: {
        circle: {
          center: { latitude: query.location.latitude, longitude: query.location.longitude },
          radius: query.radiusMeters,
        },
      },
      includedTypes: query.category ? PLACE_CATEGORY_MAP[query.category] : undefined,
    };
    const res = await this.callPlacesApi("places:searchNearby", body);
    return (res.places ?? []).map((p: GooglePlace) => this.toEntity(p));
  }

  async searchByText(query: TextSearchQuery): Promise<LocationEntity[]> {
    const body = {
      textQuery: query.query,
      maxResultCount: query.limit,
      locationBias: query.near
        ? { circle: { center: { latitude: query.near.latitude, longitude: query.near.longitude }, radius: 5000 } }
        : undefined,
    };
    const res = await this.callPlacesApi("places:searchText", body);
    return (res.places ?? []).map((p: GooglePlace) => this.toEntity(p));
  }

  async getById(id: string): Promise<LocationEntity | null> {
    const placeId = id.startsWith("google:") ? id.slice("google:".length) : id;
    try {
      const res = await this.callPlacesApi(`places/${placeId}`, undefined, "GET");
      return this.toEntity(res as GooglePlace);
    } catch {
      return null;
    }
  }

  private async callPlacesApi(path: string, body?: unknown, method: "GET" | "POST" = "POST"): Promise<any> {
    const apiKey = this.requireApiKey();
    const fieldMask =
      "id,displayName,formattedAddress,location,rating,userRatingCount,types,websiteUri,internationalPhoneNumber,accessibilityOptions";
    const res = await fetch(`https://places.googleapis.com/v1/${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": method === "GET" ? fieldMask : `places.${fieldMask.split(",").join(",places.")}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      throw new ProviderError(this.name, `Places API request failed with status ${res.status}`);
    }
    return res.json();
  }
}
