import fs from "fs";
import nodePath from "path";
import yaml from "js-yaml";
import { z } from "zod";
import { childLogger } from "@locaguide/shared";

const log = childLogger({ component: "aiConfig" });

/**
 * AI model routing configuration. Loaded from config/ai.yaml (see that file
 * for the default). Operators can change providers/models/fallback/limits
 * without touching application code.
 */
const aiModelPolicySchema = z.object({
  max_tokens: z.number().default(1024),
  timeout_ms: z.number().default(15000),
  retries: z.number().default(2),
  temperature: z.number().default(0.2),
});

const aiConfigSchema = z.object({
  ai: z.object({
    default_provider: z.string(),
    default_model: z.string(),
    fallback_provider: z.string().optional(),
    fallback_model: z.string().optional(),
    rate_limit_per_minute: z.number().default(60),
    policy: aiModelPolicySchema.default({}),
    allowed_providers: z.array(z.string()).default(["mock"]),
    allowed_models: z.array(z.string()).default(["mock-v1"]),
  }),
});

export type AIConfig = z.infer<typeof aiConfigSchema>;

let cached: AIConfig | undefined;

export function loadAIConfig(path: string): AIConfig {
  if (cached) return cached;
  if (!fs.existsSync(path)) {
    // Safe default: mock provider only, so the system always boots.
    log.warn(
      { requestedPath: path, resolvedPath: nodePath.resolve(path) },
      "AI config file not found - falling back to mock-only defaults. " +
        "If you expected real providers to be enabled, check the process's working directory - " +
        "config paths are resolved relative to cwd, not the repo root.",
    );
    cached = aiConfigSchema.parse({
      ai: {
        default_provider: "mock",
        default_model: "mock-v1",
        allowed_providers: ["mock"],
        allowed_models: ["mock-v1"],
      },
    });
    return cached;
  }
  const raw = yaml.load(fs.readFileSync(path, "utf-8"));
  cached = aiConfigSchema.parse(raw);
  return cached;
}

export function resetAIConfigCacheForTests(): void {
  cached = undefined;
}
