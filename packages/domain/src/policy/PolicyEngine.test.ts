import type { PolicyConfig } from "@locaguide/config";
import { PolicyEngine } from "./PolicyEngine";

function buildConfig(overrides: Partial<PolicyConfig> = {}): PolicyConfig {
  return {
    providers: { location: ["mock"], reviews: ["mock", "community"], products: ["mock"], ai: ["mock"] },
    data_retention: { precise_location_history_days: 0, ai_request_log_days: 90, audit_log_days: 365 },
    moderation: {
      auto_hide_spam_score_threshold: 0.9,
      auto_hide_on_report_count: 5,
      require_manual_review_for_media: true,
    },
    geo_restrictions: { blocked_country_codes: [] },
    features: {},
    ...overrides,
  };
}

describe("PolicyEngine", () => {
  it("allows only configured providers", () => {
    const engine = new PolicyEngine(buildConfig());
    expect(engine.isLocationProviderAllowed("mock")).toBe(true);
    expect(engine.isLocationProviderAllowed("google_places")).toBe(false);
  });

  it("defaults to minimal precise-location retention", () => {
    const engine = new PolicyEngine(buildConfig());
    expect(engine.preciseLocationRetentionDays()).toBe(0);
  });

  it("exposes moderation thresholds", () => {
    const engine = new PolicyEngine(buildConfig());
    expect(engine.moderationThresholds()).toEqual({
      autoHideSpamScoreThreshold: 0.9,
      autoHideOnReportCount: 5,
    });
  });

  it("checks geo restrictions", () => {
    const engine = new PolicyEngine(buildConfig({ geo_restrictions: { blocked_country_codes: ["XX"] } }));
    expect(engine.isCountryBlocked("XX")).toBe(true);
    expect(engine.isCountryBlocked("US")).toBe(false);
  });

  it("falls back to the provided default for unknown feature flags", () => {
    const engine = new PolicyEngine(buildConfig());
    expect(engine.isFeatureEnabled("unknown_feature", true)).toBe(true);
    expect(engine.isFeatureEnabled("unknown_feature")).toBe(false);
  });
});
