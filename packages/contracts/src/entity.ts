import { z } from "zod";

export const EntityCategory = z.enum([
  "SHOPPING_MALL",
  "MARKET",
  "HOTEL",
  "RESTAURANT",
  "BANK",
  "HOSPITAL",
  "TOURIST_ATTRACTION",
  "STORE",
  "PHARMACY",
  "AIRPORT",
  "RAILWAY_STATION",
  "CINEMA",
  "ENTERTAINMENT_VENUE",
  "UNIVERSITY",
  "OFFICE",
  "PUBLIC_PLACE",
  "OTHER",
]);
export type EntityCategory = z.infer<typeof EntityCategory>;

export const GeoPoint = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});
export type GeoPoint = z.infer<typeof GeoPoint>;

export const OpeningHours = z.object({
  dayOfWeek: z.number().min(0).max(6),
  opens: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
  closes: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
  closedAllDay: z.boolean().default(false),
});
export type OpeningHours = z.infer<typeof OpeningHours>;

/**
 * A real-world entity (mall, hotel, restaurant, etc). This is the canonical
 * shape produced by LocationProvider implementations, independent of which
 * upstream provider (Google Places, mock, future providers) supplied it.
 */
export const LocationEntity = z.object({
  id: z.string(),
  tenantId: z.string().nullable().default(null),
  name: z.string(),
  category: EntityCategory,
  secondaryCategories: z.array(z.string()).default([]),
  address: z.string().nullable(),
  location: GeoPoint,
  rating: z.number().min(0).max(5).nullable(),
  reviewCount: z.number().int().nonnegative().nullable(),
  openingHours: z.array(OpeningHours).default([]),
  website: z.string().url().nullable(),
  phone: z.string().nullable(),
  accessibility: z.array(z.string()).default([]),
  sourceProvider: z.string(),
  sourceProviderId: z.string(),
  attribution: z.string().nullable(),
  isDemoData: z.boolean().default(false),
  fetchedAt: z.string().datetime(),
});
export type LocationEntity = z.infer<typeof LocationEntity>;

export const NearbySearchQuery = z.object({
  location: GeoPoint,
  radiusMeters: z.number().positive().max(50000).default(1500),
  category: EntityCategory.optional(),
  limit: z.number().int().positive().max(50).default(20),
});
export type NearbySearchQuery = z.infer<typeof NearbySearchQuery>;

export const TextSearchQuery = z.object({
  query: z.string().min(1).max(200),
  near: GeoPoint.optional(),
  category: EntityCategory.optional(),
  limit: z.number().int().positive().max(50).default(20),
});
export type TextSearchQuery = z.infer<typeof TextSearchQuery>;
