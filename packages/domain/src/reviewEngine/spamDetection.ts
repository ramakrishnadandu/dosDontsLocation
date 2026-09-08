/**
 * Heuristic spam scoring for reviews and community opinions. Deliberately
 * simple and explainable (each signal is documented) rather than an opaque
 * ML classifier - replace/augment with a trained model later if needed,
 * but keep the reasons list so moderators can see WHY something was flagged.
 */
export interface SpamSignal {
  score: number;
  reasons: string[];
}

const URL_PATTERN = /https?:\/\/\S+|www\.\S+/gi;
const EXCESSIVE_PUNCTUATION = /[!?]{3,}/;
const ALL_CAPS_WORD = /\b[A-Z]{4,}\b/;

export function scoreSpam(text: string): SpamSignal {
  const reasons: string[] = [];
  let score = 0;

  const urlMatches = text.match(URL_PATTERN) ?? [];
  if (urlMatches.length >= 1) {
    score += 0.4;
    reasons.push("contains_link");
  }
  if (urlMatches.length >= 2) {
    score += 0.2;
    reasons.push("multiple_links");
  }
  if (EXCESSIVE_PUNCTUATION.test(text)) {
    score += 0.15;
    reasons.push("excessive_punctuation");
  }
  if (ALL_CAPS_WORD.test(text)) {
    score += 0.15;
    reasons.push("all_caps_shouting");
  }
  if (/\b(win|prize|click here|free money|guaranteed)\b/i.test(text)) {
    score += 0.3;
    reasons.push("promotional_keywords");
  }
  if (text.trim().length < 5) {
    score += 0.1;
    reasons.push("too_short_to_evaluate");
  }

  return { score: Math.min(1, Number(score.toFixed(2))), reasons };
}

const PII_PATTERNS: Array<{ label: string; pattern: RegExp }> = [
  { label: "email", pattern: /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i },
  { label: "phone", pattern: /\b(?:\+?\d[\s-]?){9,13}\b/ },
  { label: "credit_card_like", pattern: /\b(?:\d[ -]?){13,16}\b/ },
];

export function containsPersonalInformation(text: string): { found: boolean; types: string[] } {
  const types = PII_PATTERNS.filter((p) => p.pattern.test(text)).map((p) => p.label);
  return { found: types.length > 0, types };
}

export function containsMaliciousLink(text: string): boolean {
  const urls = text.match(URL_PATTERN) ?? [];
  const suspiciousTld = /\.(zip|xyz|top|click|link)(\/|\s|$)/i;
  return urls.some((u) => suspiciousTld.test(u));
}
