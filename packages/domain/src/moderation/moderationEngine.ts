import type { ModerationSignal } from "@locaguide/contracts";
import { containsMaliciousLink, containsPersonalInformation, scoreSpam } from "../reviewEngine/spamDetection";
import { jaccardSimilarity } from "../reviewEngine/duplicateDetection";

export interface ModerationContext {
  text: string;
  /** Text of the same author's previous submissions, for duplicate detection. */
  priorTextsBySameAuthor?: string[];
}

const DUPLICATE_THRESHOLD = 0.85;

/**
 * Computes moderation signals for a piece of community content (an opinion,
 * a tip, free text, etc). This NEVER auto-decides "remove" purely because
 * content is negative (section 17) - it only surfaces signals. The actual
 * auto-hide/manual-review decision is made by the Policy Engine using
 * configured thresholds (config/policies.yaml).
 */
export function computeModerationSignal(ctx: ModerationContext): ModerationSignal {
  const spam = scoreSpam(ctx.text);
  const pii = containsPersonalInformation(ctx.text);
  const maliciousLink = containsMaliciousLink(ctx.text);
  const isDuplicate = (ctx.priorTextsBySameAuthor ?? []).some(
    (prior) => jaccardSimilarity(prior, ctx.text) >= DUPLICATE_THRESHOLD,
  );

  return {
    isSpam: spam.score >= 0.6,
    spamScore: spam.score,
    isDuplicate,
    containsPersonalInformation: pii.found,
    containsMaliciousLink: maliciousLink,
    // Toxicity detection requires a dedicated model/service; this heuristic
    // placeholder is deliberately conservative (flags nothing) so it never
    // silently over-removes content. Wire up a real classifier before
    // relying on this signal for auto-moderation of harassment.
    toxicityScore: 0,
  };
}

export type ModerationDecision = "ALLOW" | "AUTO_HIDE" | "QUEUE_FOR_REVIEW";

export interface ModerationThresholds {
  autoHideSpamScoreThreshold: number;
  autoHideOnReportCount: number;
}

export function decideModerationAction(
  signal: ModerationSignal,
  reportCount: number,
  thresholds: ModerationThresholds,
): ModerationDecision {
  if (signal.isSpam && signal.spamScore >= thresholds.autoHideSpamScoreThreshold) return "AUTO_HIDE";
  if (signal.containsMaliciousLink) return "QUEUE_FOR_REVIEW";
  if (reportCount >= thresholds.autoHideOnReportCount) return "QUEUE_FOR_REVIEW";
  if (signal.containsPersonalInformation) return "QUEUE_FOR_REVIEW";
  return "ALLOW";
}
