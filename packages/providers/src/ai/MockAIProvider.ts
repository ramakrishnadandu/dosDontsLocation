import type { AIGenerationRequest, AIGenerationResult, AIProvider } from "./AIProvider";

export interface BriefingEvidenceItem {
  category: string;
  text: string;
  confidence: number;
}

export interface BriefingEvidencePayload {
  entityName: string;
  items: BriefingEvidenceItem[];
}

const NOT_AVAILABLE = "Information not available from the current sources.";

/**
 * Deterministic, offline AI provider used for demo mode, tests, and as the
 * last-resort fallback when no real provider is configured or reachable.
 *
 * It does NOT invent facts: it only ever rephrases the evidence items it is
 * given. If no evidence items are supplied it returns the canonical
 * "not available" message rather than fabricating content (see section 42,
 * Hallucination Control).
 */
export class MockAIProvider implements AIProvider {
  readonly name = "mock";
  readonly isConfigured = true;

  async generate(request: AIGenerationRequest): Promise<AIGenerationResult> {
    const start = Date.now();
    const payload = request.evidence as BriefingEvidencePayload;
    const items = Array.isArray(payload?.items) ? payload.items : [];

    let summary: string;
    let confidence: number;

    if (items.length === 0) {
      summary = NOT_AVAILABLE;
      confidence = 0;
    } else {
      const sentences = items.slice(0, 5).map((i) => i.text.replace(/\.$/, ""));
      summary = `${payload.entityName ?? "This location"}: ${sentences.join(". ")}.`;
      confidence = Number((items.reduce((sum, i) => sum + i.confidence, 0) / items.length).toFixed(2));
    }

    const outputText = JSON.stringify({ summary, confidence });

    return {
      provider: this.name,
      model: "mock-v1",
      outputText,
      tokensUsed: { prompt: 0, completion: 0 },
      latencyMs: Date.now() - start,
      generatedAt: new Date().toISOString(),
    };
  }
}
