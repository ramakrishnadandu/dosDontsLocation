import { ProviderError } from "@locaguide/shared";
import type { AIGenerationRequest, AIGenerationResult, AIProvider } from "./AIProvider";

/**
 * NOT executed/tested in this environment (no OPENAI_API_KEY available).
 * Implemented against the documented Chat Completions API shape. Review
 * against a real key before production use.
 */
export class OpenAIProvider implements AIProvider {
  readonly name = "openai";

  constructor(
    private readonly apiKey: string | undefined,
    private readonly model = "gpt-4o-mini",
  ) {}

  get isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  async generate(request: AIGenerationRequest): Promise<AIGenerationResult> {
    if (!this.apiKey) {
      throw new ProviderError(this.name, "OPENAI_API_KEY is not configured.");
    }
    const start = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), request.timeoutMs ?? 15000);

    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          temperature: request.temperature ?? 0.2,
          max_tokens: request.maxTokens ?? 512,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: request.systemInstructions },
            { role: "system", content: request.developerInstructions },
            {
              role: "user",
              content: JSON.stringify({ evidence: request.evidence, userInput: request.userInput ?? null }),
            },
          ],
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new ProviderError(this.name, `OpenAI request failed with status ${res.status}`);
      }
      const data = (await res.json()) as {
        choices: { message: { content: string } }[];
        usage?: { prompt_tokens: number; completion_tokens: number };
      };
      const outputText = data.choices[0]?.message.content ?? "{}";
      return {
        provider: this.name,
        model: this.model,
        outputText,
        tokensUsed: {
          prompt: data.usage?.prompt_tokens ?? 0,
          completion: data.usage?.completion_tokens ?? 0,
        },
        latencyMs: Date.now() - start,
        generatedAt: new Date().toISOString(),
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}
