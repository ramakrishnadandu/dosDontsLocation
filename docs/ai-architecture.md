# AI Architecture

## Provider abstraction

`packages/providers/src/ai/AIProvider.ts` defines the single interface
every AI backend implements:

```ts
interface AIProvider {
  readonly name: string;
  readonly isConfigured: boolean;
  generate(request: AIGenerationRequest): Promise<AIGenerationResult>;
}
```

Implementations: `MockAIProvider` (deterministic, always available),
`OllamaProvider` (local, open-source, no API key - see "Local open-source
model" below), `OpenAIProvider`, `AnthropicProvider` (both call the real
HTTP APIs when their key is set - see "Verification status" below).

## Routing, fallback, retry (section 10)

`AIRouter` (`packages/providers/src/ai/AIRouter.ts`) reads
`config/ai.yaml` and tries, in order: `default_provider` →
`fallback_provider` → `mock`, skipping any provider that is not
`isConfigured` or not in the policy allow-list, retrying each provider
`policy.retries` times before moving on. Because `mock` is always
appended and is always configured, **a briefing request never hard-fails
due to an AI outage** - it degrades to the evidence-only mock summary.

```yaml
# services/api/config/ai.yaml
ai:
  default_provider: ollama
  fallback_provider: openai
  policy: { max_tokens: 512, timeout_ms: 20000, retries: 1, temperature: 0.2 }
```

## Prompt safety (section 41)

`packages/domain/src/recommendationEngine/prompts.ts` is the **only**
place a prompt is assembled. Every `AIGenerationRequest` separates:

1. `systemInstructions` - fixed, forbids inventing facts, mandates the
   canonical "not available" response for empty evidence, forbids
   presenting synthesis as fact or accusing named individuals/businesses.
2. `developerInstructions` - fixed, task-specific ("write a 3-sentence
   summary of these evidence items").
3. `evidence` - a structured JSON payload the recommendation engine
   already computed deterministically (never raw review text, never
   another user's private data).
4. `userInput` - unused in the current briefing flow; the interface
   supports it for future features (e.g. free-text search) but it is
   never concatenated into the instructions fields.

The response is required to be a single JSON object
(`{"summary": string, "confidence": number}`); the caller
(`RecommendationEngine.briefing()`) parses it and rejects (falls back to
no AI item) anything that doesn't match that shape or whose `confidence`
is outside `[0, 1]` - this is the "validate AI output before returning it"
requirement from section 41.

## Hallucination control (section 42)

- The engine never asks the model to originate facts - only to rephrase
  facts/signals/opinions it already assembled. If there is no evidence,
  the system prompt mandates the literal string "Information not
  available from the current sources." with `confidence: 0` - see
  `MockAIProvider` and the corresponding test
  `RecommendationEngine.test.ts` ("returns the canonical not-available
  message when there is no evidence at all").
- `Evidence.expiresAt` is set per category (`REVIEW_SIGNAL`: 7 days,
  `AI_INTERPRETATION`: 24 hours) so a stale AI summary is not served
  indefinitely; `packages/contracts/src/evidence.ts#isExpired` is the
  single place "is this still fresh" is decided.

## Cost/token tracking (section 10)

`AIRouter` accepts an optional `AIUsageRecorder` and the `AIRequest`/
`AIResponse` Prisma tables exist for persisting provider/model/token/
latency/success per call - wiring the recorder into `services/api` is a
one-line addition (`new AIRouter(providers, config, recorder)`) left as a
follow-up since it is not required for demo-mode correctness.

## Local open-source model (Ollama)

`OllamaProvider` (`packages/providers/src/ai/OllamaProvider.ts`) calls a
locally-running [Ollama](https://ollama.com) server's native `/api/chat`
endpoint with `format: "json"` (constrains decoding to valid JSON - more
reliable than asking a small model to "please output JSON"). No API key,
nothing leaves the machine - this is the concrete implementation of what
`docs/on-prem.md` describes as the integration point for enterprise/
restricted-network deployments that cannot reach external AI APIs at all.

It's set as `default_provider` in `config/ai.yaml` ahead of OpenAI/
Anthropic specifically because it's real and free where those need a paid
key - `AIRouter` still degrades to `openai` → `mock` automatically if the
Ollama server isn't reachable, so nothing breaks if it's stopped.

**Model choice**: `llama3.2:3b` (~2GB, Meta) was chosen for a good balance
of quality and speed on modest hardware for this task specifically -
rephrasing a handful of short evidence bullets into one paragraph, not
open-ended reasoning. Swap `OLLAMA_MODEL` for any other model you've
pulled (`ollama pull <model>`) if you want a different size/quality
tradeoff; no code change needed.

**Cold-start note**: the *first* request after the Ollama server starts
(or after a model has been idle long enough for Ollama to unload it from
memory, ~5 min by default) can take significantly longer than steady
state while the model loads - in testing this ranged from under 2s (warm)
to occasionally exceeding the 20s policy timeout on a cold load. If you
see intermittent `ollama` failures immediately after starting the server,
that's why; `AIRouter` falls through to `openai`/`mock` when it happens,
so briefings still succeed, just without the Ollama-authored summary that
one time.

**Verified against a live local instance** in this environment (Ollama
0.33.3, model `llama3.2:3b`): confirmed producing valid, schema-conforming
JSON and a summary that only rephrases the evidence it was given, both
directly (isolated `generate()` call) and through the full
`/locations/:id/intelligence` endpoint - `Evidence.modelVersion` on the
resulting `AI_INTERPRETATION` item reads `llama3.2:3b`.

## Verification status (cloud providers)

`OpenAIProvider` and `AnthropicProvider` are implemented against each
provider's documented Chat Completions / Messages API request/response
shape, but **were not executed against a real API key in this
environment** (none was available). Treat them as reviewed-but-unverified;
run a smoke test against a real key before relying on them in production.
`MockAIProvider` and `OllamaProvider` are both verified (see above and
the automated test suite).
