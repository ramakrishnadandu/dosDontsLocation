/**
 * Unified AI provider interface. Backend-only - API keys for any AI
 * provider must NEVER be sent to or embedded in mobile/web clients.
 *
 * Callers MUST separate system/policy instructions, developer instructions,
 * retrieved evidence, and user input (see docs/ai-architecture.md and
 * section 41 of the product spec, "AI PROMPT SAFETY"). User input must
 * never be concatenated into systemInstructions.
 */
export interface AIGenerationRequest {
  /** Fixed, non-user-controlled system/policy instructions. */
  systemInstructions: string;
  /** Fixed developer instructions (task-specific, still not user text). */
  developerInstructions: string;
  /** Structured evidence (JSON-serializable) the model must ground its answer in. */
  evidence: unknown;
  /** Optional, length-limited, sanitized end-user text (e.g. a search phrase). Never treated as instructions. */
  userInput?: string;
  /** Logical name of the JSON schema the caller will validate the output against. */
  responseSchemaName: string;
  maxTokens?: number;
  temperature?: number;
  /** Aborts the request after this many ms; enforced by AIRouter as well. */
  timeoutMs?: number;
}

export interface AIGenerationResult {
  provider: string;
  model: string;
  /** Raw text returned by the model (expected to be a JSON document). */
  outputText: string;
  tokensUsed: { prompt: number; completion: number };
  latencyMs: number;
  generatedAt: string;
}

export interface AIProvider {
  readonly name: string;
  readonly isConfigured: boolean;

  generate(request: AIGenerationRequest): Promise<AIGenerationResult>;
}
