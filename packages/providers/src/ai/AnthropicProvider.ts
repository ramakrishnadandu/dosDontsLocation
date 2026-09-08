import { ProviderError } from "@locaguide/shared";
import type { AIGenerationRequest, AIGenerationResult, AIProvider } from "./AIProvider";

/**
 * NOT executed/tested in this environment (no ANTHROPIC_API_KEY available).
 * Implemented against the documented Messages API shape. Review against a
 * real key before production use.
 */
export class AnthropicProvider implements AIProvider {
  readonly name = "anthropic";

  constructor(
    private readonly apiKey: string | undefined,
    private readonly model = "claude-haiku-4-5-20251001",
  ) {}

  get isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  async generate(request: AIGenerationRequest): Promise<AIGenerationResult> {
    if (!this.apiKey) {
      throw new ProviderError(this.name, "ANTHROPIC_API_KEY is not configured.");
    }
    const start = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), request.timeoutMs ?? 15000);

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: request.maxTokens ?? 512,
          temperature: request.temperature ?? 0.2,
          system: `${request.systemInstructions}\n\n${request.developerInstructions}\n\nRespond with a single JSON object only.`,
          messages: [
            {
              role: "user",
              content: JSON.stringify({ evidence: request.evidence, userInput: request.userInput ?? null }),
            },
          ],
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new ProviderError(this.name, `Anthropic request failed with status ${res.status}`);
      }
      const data = (await res.json()) as {
        content: { type: string; text?: string }[];
        usage?: { input_tokens: number; output_tokens: number };
      };
      const outputText = data.content.find((c) => c.type === "text")?.text ?? "{}";
      return {
        provider: this.name,
        model: this.model,
        outputText,
        tokensUsed: {
          prompt: data.usage?.input_tokens ?? 0,
          completion: data.usage?.output_tokens ?? 0,
        },
        latencyMs: Date.now() - start,
        generatedAt: new Date().toISOString(),
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}
