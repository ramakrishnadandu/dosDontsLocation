/**
 * Near-duplicate detection using Jaccard similarity over word shingles.
 * Simple, deterministic, and explainable - avoids counting the same
 * opinion twice when aggregating aspect signals (section 7 of the spec).
 */
function toWordSet(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, "")
      .split(/\s+/)
      .filter(Boolean),
  );
}

export function jaccardSimilarity(a: string, b: string): number {
  const setA = toWordSet(a);
  const setB = toWordSet(b);
  if (setA.size === 0 && setB.size === 0) return 1;
  const intersectionSize = [...setA].filter((w) => setB.has(w)).length;
  const unionSize = new Set([...setA, ...setB]).size;
  return unionSize === 0 ? 0 : intersectionSize / unionSize;
}

export const DUPLICATE_SIMILARITY_THRESHOLD = 0.85;

export interface DuplicateCheckItem {
  id: string;
  text: string;
  authorDisplayName: string | null;
}

/**
 * Returns a map of reviewId -> duplicateOfReviewId for items that are
 * near-duplicates of an earlier item (by array order) from the SAME author.
 * Cross-author identical text is not flagged here (that's a spam/coordinated
 * signal, not a duplicate-opinion signal) - see spamDetection.ts.
 */
export function findDuplicates(items: DuplicateCheckItem[]): Map<string, string> {
  const duplicates = new Map<string, string>();
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item || duplicates.has(item.id)) continue;
    for (let j = 0; j < i; j++) {
      const earlier = items[j];
      if (!earlier || duplicates.has(earlier.id)) continue;
      if (earlier.authorDisplayName !== item.authorDisplayName) continue;
      if (jaccardSimilarity(item.text, earlier.text) >= DUPLICATE_SIMILARITY_THRESHOLD) {
        duplicates.set(item.id, earlier.id);
        break;
      }
    }
  }
  return duplicates;
}
