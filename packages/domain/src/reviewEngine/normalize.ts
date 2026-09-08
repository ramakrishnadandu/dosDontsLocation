/**
 * Detects a coarse language code for a review. This is a lightweight
 * heuristic (Unicode script ranges), not a full language-ID model - good
 * enough to route en/hi/te content and flag anything else as "und".
 * Replace with a proper language-ID library/service if higher accuracy
 * is required.
 */
export function detectLanguage(text: string): string {
  if (/[ఀ-౿]/.test(text)) return "te"; // Telugu script
  if (/[ऀ-ॿ]/.test(text)) return "hi"; // Devanagari script
  if (/[a-zA-Z]/.test(text)) return "en";
  return "und";
}

const CONTROL_CHAR_PATTERN = new RegExp(
  `[${String.fromCharCode(0)}-${String.fromCharCode(31)}${String.fromCharCode(127)}]`,
  "g",
);

/** Trims, collapses whitespace, and strips control characters from raw review text. */
export function normalizeText(text: string): string {
  return text.replace(CONTROL_CHAR_PATTERN, "").replace(/\s+/g, " ").trim();
}
