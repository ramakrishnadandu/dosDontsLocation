import type { PolicyConfig } from "@locaguide/config";

/**
 * Thin, explicit wrapper around the loaded policy configuration
 * (config/policies.yaml). Application code should call these methods
 * rather than reading PolicyConfig fields directly, so policy semantics
 * stay centralized (section 21, Governance/Policy Engine).
 */
export class PolicyEngine {
  constructor(private readonly config: PolicyConfig) {}

  isLocationProviderAllowed(providerName: string): boolean {
    return this.config.providers.location.includes(providerName);
  }

  isReviewProviderAllowed(providerName: string): boolean {
    return this.config.providers.reviews.includes(providerName);
  }

  isProductProviderAllowed(providerName: string): boolean {
    return this.config.providers.products.includes(providerName);
  }

  isAIProviderAllowed(providerName: string): boolean {
    return this.config.providers.ai.includes(providerName);
  }

  preciseLocationRetentionDays(): number {
    return this.config.data_retention.precise_location_history_days;
  }

  aiRequestLogRetentionDays(): number {
    return this.config.data_retention.ai_request_log_days;
  }

  auditLogRetentionDays(): number {
    return this.config.data_retention.audit_log_days;
  }

  moderationThresholds(): { autoHideSpamScoreThreshold: number; autoHideOnReportCount: number } {
    return {
      autoHideSpamScoreThreshold: this.config.moderation.auto_hide_spam_score_threshold,
      autoHideOnReportCount: this.config.moderation.auto_hide_on_report_count,
    };
  }

  requiresManualReviewForMedia(): boolean {
    return this.config.moderation.require_manual_review_for_media;
  }

  isCountryBlocked(countryCode: string): boolean {
    return this.config.geo_restrictions.blocked_country_codes.includes(countryCode);
  }

  isFeatureEnabled(featureKey: string, defaultValue = false): boolean {
    return this.config.features[featureKey] ?? defaultValue;
  }
}
