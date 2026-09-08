/// Builds a standard Google Maps search URL from coordinates or a name -
/// used for "Share" and "Open in Google Maps" actions. This is the
/// inverse of packages/domain/src/googleMaps/parseGoogleMapsUrl.ts on the
/// backend (which parses a link a user pastes back into coordinates).
String buildGoogleMapsUrl({double? latitude, double? longitude, String? name}) {
  if (latitude != null && longitude != null) {
    return 'https://www.google.com/maps/search/?api=1&query=$latitude,$longitude';
  }
  if (name != null && name.isNotEmpty) {
    return 'https://www.google.com/maps/search/?api=1&query=${Uri.encodeComponent(name)}';
  }
  return 'https://www.google.com/maps';
}
