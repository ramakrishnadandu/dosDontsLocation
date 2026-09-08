import type { AIConfig } from "@locaguide/config";
import { childLogger } from "@locaguide/shared";
import type { AIGenerationRequest, AIGenerationResult, AIProvider } from "./AIProvider";

const log = childLogger({ component: "AIRouter" });

export interface AIUsageRecorder {
  record(entry: {
    provider: string;
    model: string;
    tokensUsed: { prompt: number; completion: number };
    latencyMs: number;
    succeeded: boolean;
  }): void;
}

/**
 * Routes AI generation requests according to config/ai.yaml:
 *  - tries the default provider (with retries + timeout)
 *  - falls back to the configured fallback provider on failure
 *  - falls back to the always-available mock provider as a last resort so
 *    the product never hard-fails a recommendation request
 * Also enforces the allow-list (policy engine) of providers/models and
 * records basic usage for cost/token tracking.
 */
export class AIRouter {
  constructor(
    private readonly providers: Record<string, AIProvider>,
    private readonly config: AIConfig,
    private readonly usageRecorder?: AIUsageRecorder,
  ) {}

  async generate(request: AIGenerationRequest): Promise<AIGenerationResult> {
    const order = [this.config.ai.default_provider, this.config.ai.fallback_provider, "mock"].filter(
      (p, idx, arr): p is string => Boolean(p) && arr.indexOf(p) === idx,
    );

    let lastError: unknown;
    for (const providerName of order) {
      if (!this.config.ai.allowed_providers.includes(providerName)) {
        log.warn({ providerName }, "Skipping AI provider not in policy allow-list");
        continue;
      }
      const provider = this.providers[providerName];
      if (!provider || !provider.isConfigured) continue;

      const retries = this.config.ai.policy.retries;
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const result = await provider.generate({
            ...request,
            timeoutMs: request.timeoutMs ?? this.config.ai.policy.timeout_ms,
            maxTokens: request.maxTokens ?? this.config.ai.policy.max_tokens,
            temperature: request.temperature ?? this.config.ai.policy.temperature,
          });
          this.usageRecorder?.record({
            provider: result.provider,
            model: result.model,
            tokensUsed: result.tokensUsed,
            latencyMs: result.latencyMs,
            succeeded: true,
          });
          return result;
        } catch (err) {
          lastError = err;
          log.warn({ providerName, attempt, err: (err as Error).message }, "AI provider attempt failed");
          this.usageRecorder?.record({
            provider: providerName,
            model: "unknown",
            tokensUsed: { prompt: 0, completion: 0 },
            latencyMs: 0,
            succeeded: false,
          });
        }
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error("All configured AI providers failed and no fallback was available.");
  }
}
