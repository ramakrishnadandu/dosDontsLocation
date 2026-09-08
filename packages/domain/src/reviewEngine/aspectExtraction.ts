import type { ReviewAspect } from "@locaguide/contracts";
import { scoreSentiment } from "./sentiment";

const ASPECT_KEYWORDS: Record<ReviewAspect, string[]> = {
  PARKING: ["parking", "car park", "valet"],
  CLEANLINESS: ["clean", "dirty", "hygiene", "spotless", "washroom", "restroom"],
  STAFF: ["staff", "employee", "waiter", "receptionist", "nursing", "nurse"],
  FOOD: ["food", "meal", "menu", "breakfast", "dish", "cuisine"],
  PRICE: ["price", "expensive", "cheap", "value for money", "cost", "affordable"],
  SERVICE: ["service", "check-in", "checkout", "billing"],
  CROWDING: ["crowd", "crowded", "busy", "packed"],
  NOISE: ["noise", "noisy", "loud", "quiet"],
  LOCATION: ["location", "address", "far", "central"],
  ROOMS: ["room", "bed", "suite"],
  ACCESSIBILITY: ["wheelchair", "accessib", "ramp", "elevator"],
  WAITING_TIME: ["waiting", "wait time", "queue", "line"],
  SAFETY: ["safe", "unsafe", "security", "theft"],
  AMBIENCE: ["ambience", "atmosphere", "decor", "vibe"],
};

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export interface ExtractedAspectMention {
  aspect: ReviewAspect;
  sentiment: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
  snippet: string;
}

/**
 * Extracts aspect mentions (parking, cleanliness, staff, ...) from review
 * text along with a per-sentence sentiment. A single review can mention
 * multiple aspects; each is recorded independently so aggregate signals
 * (aspect -> positive/negative/neutral counts) can be computed downstream.
 */
export function extractAspects(text: string): ExtractedAspectMention[] {
  const mentions: ExtractedAspectMention[] = [];
  const sentences = splitSentences(text);

  for (const sentence of sentences) {
    const lower = sentence.toLowerCase();
    for (const [aspect, keywords] of Object.entries(ASPECT_KEYWORDS) as [ReviewAspect, string[]][]) {
      if (keywords.some((k) => lower.includes(k))) {
        mentions.push({
          aspect,
          sentiment: scoreSentiment(sentence).sentiment,
          snippet: sentence,
        });
      }
    }
  }
  return mentions;
}
