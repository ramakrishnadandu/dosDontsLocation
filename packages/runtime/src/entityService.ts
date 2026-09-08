import type { LocationEntity, NearbySearchQuery, TextSearchQuery } from "@locaguide/contracts";
import { NotFoundError } from "@locaguide/shared";
import { prisma } from "@locaguide/db";
import { buildProviderRegistry } from "./registry";

/** Upserts the canonical entity cache row so other tables can FK to entityId. */
async function cacheEntity(entity: LocationEntity): Promise<void> {
  await prisma.entity.upsert({
    where: { id: entity.id },
    create: {
      id: entity.id,
      tenantId: entity.tenantId,
      name: entity.name,
      category: entity.category,
      address: entity.address,
      latitude: entity.location.latitude,
      longitude: entity.location.longitude,
      sourceProvider: entity.sourceProvider,
      sourceProviderId: entity.sourceProviderId,
      isDemoData: entity.isDemoData,
      raw: entity,
      fetchedAt: new Date(entity.fetchedAt),
    },
    update: {
      name: entity.name,
      address: entity.address,
      raw: entity,
      fetchedAt: new Date(entity.fetchedAt),
    },
  });
}

export async function searchNearby(query: NearbySearchQuery): Promise<LocationEntity[]> {
  const { locationProvider } = buildProviderRegistry();
  const results = await locationProvider.searchNearby(query);
  await Promise.all(results.map(cacheEntity));
  return results;
}

export async function searchByText(query: TextSearchQuery): Promise<LocationEntity[]> {
  const { locationProvider } = buildProviderRegistry();
  const results = await locationProvider.searchByText(query);
  await Promise.all(results.map(cacheEntity));
  return results;
}

export async function getEntityById(id: string): Promise<LocationEntity> {
  const { locationProvider } = buildProviderRegistry();
  const entity = await locationProvider.getById(id);
  if (!entity) {
    throw new NotFoundError("LOCATION_NOT_FOUND", "Location could not be identified.");
  }
  await cacheEntity(entity);
  return entity;
}
