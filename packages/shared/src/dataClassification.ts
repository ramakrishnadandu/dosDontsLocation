/**
 * Data classification levels used across LocaGuide (see docs/security.md).
 * Every field that stores user- or location-derived data should be
 * annotated (in schema comments / docs) with one of these levels.
 */
export enum DataClassification {
  PUBLIC = "PUBLIC",
  INTERNAL = "INTERNAL",
  PRIVATE = "PRIVATE",
  SENSITIVE = "SENSITIVE",
  SECRET = "SECRET",
}

/**
 * Examples (see docs/privacy.md for the full table):
 * - PUBLIC: location name, category, aggregated review signals
 * - INTERNAL: feature flags, non-sensitive config
 * - PRIVATE: user profile, saved locations, preferences
 * - SENSITIVE: precise GPS history, health-adjacent free text in opinions
 * - SECRET: API keys, password hashes, JWT signing keys
 */
