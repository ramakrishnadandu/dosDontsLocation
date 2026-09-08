import type { Sentiment } from "@locaguide/contracts";

/**
 * Lexicon-based sentiment scoring. Intentionally simple and inspectable
 * rather than a black-box model, since every score feeds directly into
 * user-facing evidence (see docs/ai-architecture.md#review-engine).
 * Swap in a proper NLP model/service later behind this same function
 * signature if higher accuracy is required.
 */
const POSITIVE_WORDS = [
  "great", "excellent", "good", "clean", "helpful", "friendly", "loved", "love",
  "amazing", "nice", "polite", "courteous", "attentive", "spotless", "reasonable",
  "quick", "recommend", "best", "caring", "professional", "stunning", "smooth",
  "affordable", "organised", "organized", "sweet", "humble", "commendable",
];

const NEGATIVE_WORDS = [
  "bad", "terrible", "dirty", "rude", "slow", "worst", "disappointing",
  "nightmare", "crowded", "noisy", "cold", "expensive", "high", "limited",
  "hard to find", "long", "difficult", "poor", "unhelpful", "mess", "messy",
  "chaotic", "frustrating", "frustrated", "overwhelming", "claustrophobic",
  "uncomfortable", "unavailable", "unorganized", "unorganised",
];

const NEGATION_WORDS = ["not", "no", "never", "n't"];

export function scoreSentiment(text: string): { sentiment: Sentiment; score: number } {
  const lower = text.toLowerCase();
  const words = lower.split(/\W+/).filter(Boolean);

  let score = 0;
  for (let i = 0; i < words.length; i++) {
    const word = words[i] ?? "";
    const precededByNegation = i > 0 && NEGATION_WORDS.includes(words[i - 1] ?? "");
    const isPositive = POSITIVE_WORDS.includes(word);
    const isNegative = NEGATIVE_WORDS.includes(word);

    if (isPositive) score += precededByNegation ? -1 : 1;
    if (isNegative) score += precededByNegation ? 1 : -1;
  }
  // Multi-word negative phrases not caught by single-word tokenization.
  for (const phrase of ["hard to find"]) {
    if (lower.includes(phrase)) score -= 1;
  }

  if (score > 0) return { sentiment: "POSITIVE", score };
  if (score < 0) return { sentiment: "NEGATIVE", score };
  return { sentiment: "NEUTRAL", score };
}
