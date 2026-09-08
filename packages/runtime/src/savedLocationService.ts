import type { AddSavedLocationInput, SavedLocation } from "@locaguide/contracts";
import { isGoogleMapsShortLink, parseGoogleMapsUrl } from "@locaguide/domain";
import { NotFoundError } from "@locaguide/shared";
import { prisma, type SavedLocation as PrismaSavedLocation } from "@locaguide/db";

/**
 * Short Google Maps links (maps.app.goo.gl, goo.gl/maps) carry no
 * coordinates in the URL itself - only the destination does, after a
 * redirect. This follows that redirect (a plain HTTP GET, never scraping
 * page content - see docs/provider-architecture.md) and returns the final
 * URL for parseGoogleMapsUrl to read. Best-effort: on any failure, returns
 * the original URL so the caller falls back to treating it as an opaque
 * link (label-only, no coordinates) rather than failing the whole request.
 */
async function resolveGoogleMapsLink(url: string): Promise<string> {
  if (!isGoogleMapsShortLink(url)) return url;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      const res = await fetch(url, { method: "GET", redirect: "follow", signal: controller.signal });
      return res.url || url;
    } finally {
      clearTimeout(timeout);
    }
  } catch {
    return url;
  }
}

function toPublic(row: PrismaSavedLocation): SavedLocation {
  return {
    id: row.id,
    entityId: row.entityId,
    label: row.label,
    note: row.note,
    sourceUrl: row.sourceUrl,
    latitude: row.latitude,
    longitude: row.longitude,
    createdAt: row.createdAt.toISOString(),
  };
}

/**
 * Adds a saved/"interested" location (section 48). Accepts any combination
 * of: an existing entityId (quick "save this place" from location details),
 * a pasted Google Maps link (parsed for name/coordinates, short links
 * resolved first), and/or a manual label - whichever information is
 * available is used, never fabricated.
 */
export async function addSavedLocation(userId: string, input: AddSavedLocationInput): Promise<SavedLocation> {
  let label = input.label ?? null;
  let latitude: number | null = null;
  let longitude: number | null = null;

  if (input.sourceUrl) {
    const resolvedUrl = await resolveGoogleMapsLink(input.sourceUrl);
    const parsed = parseGoogleMapsUrl(resolvedUrl);
    if (parsed) {
      label = label ?? parsed.name;
      latitude = parsed.latitude;
      longitude = parsed.longitude;
    }
  }

  if (input.entityId) {
    const entity = await prisma.entity.findUnique({ where: { id: input.entityId } });
    if (!entity) throw new NotFoundError("LOCATION_NOT_FOUND", "Location could not be identified.");
    label = label ?? entity.name;
    latitude = latitude ?? entity.latitude;
    longitude = longitude ?? entity.longitude;
  }

  const created = await prisma.savedLocation.create({
    data: {
      userId,
      entityId: input.entityId ?? null,
      label: label ?? "Saved place",
      note: input.note ?? null,
      sourceUrl: input.sourceUrl ?? null,
      latitude,
      longitude,
    },
  });

  return toPublic(created);
}

export async function listSavedLocations(userId: string): Promise<SavedLocation[]> {
  const rows = await prisma.savedLocation.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  return rows.map(toPublic);
}

export async function deleteSavedLocation(userId: string, id: string): Promise<void> {
  const row = await prisma.savedLocation.findUnique({ where: { id } });
  if (!row || row.userId !== userId) {
    throw new NotFoundError("SAVED_LOCATION_NOT_FOUND", "Saved location not found.");
  }
  await prisma.savedLocation.delete({ where: { id } });
}
