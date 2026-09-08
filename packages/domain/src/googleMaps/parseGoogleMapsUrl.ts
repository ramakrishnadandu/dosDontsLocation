/**
 * Parses a Google Maps URL into a best-effort name + coordinates, without
 * calling any external API. Supports the URL shapes Google Maps actually
 * produces when a user taps "Share" on a place:
 *
 *  - https://www.google.com/maps/place/Place+Name/@17.4239,78.4738,17z/...
 *  - https://www.google.com/maps/place/Place+Name/@17.4239,78.4738,17z/data=!3m1!4b1!4m6!3m5!1s...!8m2!3d17.4239!4d78.4738
 *  - https://www.google.com/maps?q=17.4239,78.4738
 *  - https://www.google.com/maps/@17.4239,78.4738,15z
 *  - https://maps.google.com/?q=Place+Name&ll=17.4239,78.4738
 *
 * Short links (maps.app.goo.gl / goo.gl/maps) are NOT handled here - they
 * require following an HTTP redirect first, which is a network operation
 * that belongs in packages/runtime (see resolveGoogleMapsLink there), kept
 * separate so this stays a pure, synchronous, unit-testable function.
 */
export interface ParsedGoogleMapsLocation {
  name: string | null;
  latitude: number | null;
  longitude: number | null;
}

const COORD_RANGE = { latMin: -90, latMax: 90, lngMin: -180, lngMax: 180 };

function inRange(lat: number, lng: number): boolean {
  return lat >= COORD_RANGE.latMin && lat <= COORD_RANGE.latMax && lng >= COORD_RANGE.lngMin && lng <= COORD_RANGE.lngMax;
}

function isGoogleMapsHost(hostname: string): boolean {
  return /(^|\.)google\.[a-z.]+$/i.test(hostname) || /(^|\.)maps\.google\.[a-z.]+$/i.test(hostname);
}

export function isGoogleMapsShortLink(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return hostname === "maps.app.goo.gl" || hostname === "goo.gl";
  } catch {
    return false;
  }
}

export function parseGoogleMapsUrl(rawUrl: string): ParsedGoogleMapsLocation | null {
  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    return null;
  }
  if (!isGoogleMapsHost(url.hostname)) return null;

  let latitude: number | null = null;
  let longitude: number | null = null;
  let name: string | null = null;

  // Most precise: !3d<lat>!4d<lng> embedded in the data= param.
  const dataMatch = url.href.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (dataMatch && dataMatch[1] && dataMatch[2]) {
    latitude = Number(dataMatch[1]);
    longitude = Number(dataMatch[2]);
  }

  // @lat,lng,zoom segment, e.g. /maps/place/X/@17.4239,78.4738,17z
  if (latitude === null || longitude === null) {
    const atMatch = url.pathname.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (atMatch && atMatch[1] && atMatch[2]) {
      latitude = Number(atMatch[1]);
      longitude = Number(atMatch[2]);
    }
  }

  // ?q=lat,lng or &ll=lat,lng
  if (latitude === null || longitude === null) {
    const qParam = url.searchParams.get("q") ?? url.searchParams.get("ll") ?? url.searchParams.get("query");
    if (qParam) {
      const qMatch = qParam.match(/^\s*(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)\s*$/);
      if (qMatch && qMatch[1] && qMatch[2]) {
        latitude = Number(qMatch[1]);
        longitude = Number(qMatch[2]);
      } else {
        name = qParam;
      }
    }
  }

  // /maps/place/<name>/... path segment.
  const placeMatch = url.pathname.match(/\/maps\/place\/([^/]+)/);
  if (placeMatch && placeMatch[1]) {
    try {
      name = decodeURIComponent(placeMatch[1].replace(/\+/g, " "));
    } catch {
      name = placeMatch[1].replace(/\+/g, " ");
    }
  }

  if (latitude !== null && longitude !== null && !inRange(latitude, longitude)) {
    latitude = null;
    longitude = null;
  }

  if (latitude === null && longitude === null && name === null) return null;

  return { name, latitude, longitude };
}
