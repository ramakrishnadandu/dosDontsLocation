import { ProviderError } from "@locaguide/shared";
import type { AIGenerationRequest, AIGenerationResult, AIProvider } from "./AIProvider";

/**
 * Local, open-source model via Ollama (https://ollama.com) - runs entirely
 * on-machine, no API key, no data leaving the network. This is the
 * provider docs/on-prem.md describes as the integration point for a
 * future local model: same AIProvider interface as OpenAIProvider/
 * AnthropicProvider, so the recommendation engine and every hallucination-
 * control rule in its prompts (packages/domain/src/recommendationEngine/prompts.ts)
 * apply identically regardless of which model answers.
 *
 * Uses Ollama's native /api/chat endpoint with `format: "json"`, which
 * makes Ollama constrain decoding to valid JSON - more reliable than
 * asking a small model to "please output JSON" unconstrained.
 *
 * isConfigured reflects whether the Ollama server is currently reachable
 * (checked lazily on first use, cached), not just whether a URL was
 * given - a local server can be stopped/started independently of the app,
 * and the AIRouter needs to know at request time whether to skip this
 * provider in favor of its fallback.
 */
export class OllamaProvider implements AIProvider {
  readonly name = "ollama";
  private reachable: boolean | undefined;

  constructor(
    private readonly baseUrl: string = "http://127.0.0.1:11434",
    private readonly model: string = "llama3.2:3b",
  ) {}

  get isConfigured(): boolean {
    // Synchronous interface requirement - genuine reachability is checked
    // (and cached) on first generate() call; assume available until proven
    // otherwise so AIRouter tries it, with graceful fallback on failure.
    return this.reachable !== false;
  }

  async generate(request: AIGenerationRequest): Promise<AIGenerationResult> {
    const start = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), request.timeoutMs ?? 20000);

    try {
      const res = await fetch(`${this.baseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.model,
          stream: false,
          format: "json",
          options: {
            temperature: request.temperature ?? 0.2,
            num_predict: request.maxTokens ?? 512,
          },
          messages: [
            { role: "system", content: `${request.systemInstructions}\n\n${request.developerInstructions}` },
            {
              role: "user",
              content: JSON.stringify({ evidence: request.evidence, userInput: request.userInput ?? null }),
            },
          ],
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        this.reachable = res.status !== 404 && res.status < 500 ? this.reachable : false;
        throw new ProviderError(this.name, `Ollama request failed with status ${res.status}`);
      }
      this.reachable = true;

      const data = (await res.json()) as {
        message?: { content?: string };
        prompt_eval_count?: number;
        eval_count?: number;
      };

      return {
        provider: this.name,
        model: this.model,
        outputText: data.message?.content ?? "{}",
        tokensUsed: {
          prompt: data.prompt_eval_count ?? 0,
          completion: data.eval_count ?? 0,
        },
        latencyMs: Date.now() - start,
        generatedAt: new Date().toISOString(),
      };
    } catch (err) {
      if (err instanceof ProviderError) throw err;
      // Connection refused, DNS failure, abort/timeout, etc - the server
      // isn't reachable right now. Remember that so AIRouter stops trying
      // this provider for the rest of the process lifetime rather than
      // paying a timeout on every request.
      this.reachable = false;
      throw new ProviderError(this.name, `Ollama server unreachable at ${this.baseUrl}: ${(err as Error).message}`);
    } finally {
      clearTimeout(timeout);
    }
  }
}
