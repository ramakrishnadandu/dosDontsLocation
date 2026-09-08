import fs from "fs";
import nodePath from "path";
import yaml from "js-yaml";
import { z } from "zod";
import { childLogger } from "@locaguide/shared";

const log = childLogger({ component: "policyConfig" });

/**
 * The Policy Engine's configuration surface (see docs/architecture.md#governance).
 * This lets operators (including future on-prem/enterprise tenants) control
 * behavior WITHOUT changing application code:
 *  - which AI/location/product providers are enabled
 *  - data retention windows
 *  - which content-moderation actions are automatic vs. manual
 *  - geographic restrictions
 */
const policyConfigSchema = z.object({
  providers: z.object({
    location: z.array(z.string()).default(["mock"]),
    reviews: z.array(z.string()).default(["mock", "community"]),
    products: z.array(z.string()).default(["mock"]),
    ai: z.array(z.string()).default(["mock"]),
  }),
  data_retention: z.object({
    precise_location_history_days: z.number().default(0),
    ai_request_log_days: z.number().default(90),
    audit_log_days: z.number().default(365),
  }),
  moderation: z.object({
    auto_hide_spam_score_threshold: z.number().default(0.9),
    auto_hide_on_report_count: z.number().default(5),
    require_manual_review_for_media: z.boolean().default(true),
  }),
  geo_restrictions: z.object({
    blocked_country_codes: z.array(z.string()).default([]),
  }),
  features: z.record(z.boolean()).default({}),
});

export type PolicyConfig = z.infer<typeof policyConfigSchema>;

let cached: PolicyConfig | undefined;

export function loadPolicyConfig(path: string): PolicyConfig {
  if (cached) return cached;
  if (!fs.existsSync(path)) {
    log.warn(
      { requestedPath: path, resolvedPath: nodePath.resolve(path) },
      "Policy config file not found - falling back to safe defaults (mock providers only). " +
        "If you expected real providers to be enabled, check the process's working directory - " +
        "config paths are resolved relative to cwd, not the repo root.",
    );
    cached = policyConfigSchema.parse({
      providers: {},
      data_retention: {},
      moderation: {},
      geo_restrictions: {},
      features: {},
    });
    return cached;
  }
  const raw = yaml.load(fs.readFileSync(path, "utf-8"));
  cached = policyConfigSchema.parse(raw);
  return cached;
}

export function resetPolicyConfigCacheForTests(): void {
  cached = undefined;
}
