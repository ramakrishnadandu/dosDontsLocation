import { z } from "zod";

export const ModerationStatus = z.enum([
  "PENDING",
  "APPROVED",
  "REJECTED",
  "AUTO_HIDDEN",
  "APPEALED",
]);
export type ModerationStatus = z.infer<typeof ModerationStatus>;

export const VisitRecency = z.enum(["TODAY", "THIS_WEEK", "EARLIER"]);
export type VisitRecency = z.infer<typeof VisitRecency>;

/**
 * A community-submitted opinion about a location. Internal moderation /
 * security metadata (isSpamScore, moderatorNotes, reporterIds, etc) is
 * intentionally NOT part of this public-facing shape - see
 * services/api's Prisma schema + admin DTOs for the internal record.
 */
export const CommunityOpinion = z.object({
  id: z.string(),
  userId: z.string(),
  entityId: z.string(),
  rating: z.number().min(1).max(5),
  title: z.string().max(140).nullable(),
  body: z.string().max(4000).nullable(),
  pros: z.array(z.string().max(200)).default([]),
  cons: z.array(z.string().max(200)).default([]),
  tips: z.array(z.string().max(300)).default([]),
  valueForMoney: z.number().min(1).max(5).nullable(),
  cleanliness: z.number().min(1).max(5).nullable(),
  parking: z.number().min(1).max(5).nullable(),
  accessibility: z.number().min(1).max(5).nullable(),
  familyFriendliness: z.number().min(1).max(5).nullable(),
  foodExperience: z.number().min(1).max(5).nullable(),
  shoppingExperience: z.number().min(1).max(5).nullable(),
  serviceExperience: z.number().min(1).max(5).nullable(),
  safetyAwareness: z.string().max(500).nullable(),
  visitRecency: VisitRecency.nullable(),
  verifiedVisit: z.boolean().default(false),
  mediaIds: z.array(z.string()).default([]),
  helpfulCount: z.number().int().nonnegative().default(0),
  reportCount: z.number().int().nonnegative().default(0),
  status: z.enum(["ACTIVE", "EDITED", "REMOVED"]).default("ACTIVE"),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  editedAt: z.string().datetime().nullable(),
});
export type CommunityOpinion = z.infer<typeof CommunityOpinion>;

export const SubmitCommunityOpinionInput = CommunityOpinion.pick({
  entityId: true,
  rating: true,
  title: true,
  body: true,
  pros: true,
  cons: true,
  tips: true,
  valueForMoney: true,
  cleanliness: true,
  parking: true,
  accessibility: true,
  familyFriendliness: true,
  foodExperience: true,
  shoppingExperience: true,
  serviceExperience: true,
  safetyAwareness: true,
  visitRecency: true,
  mediaIds: true,
}).partial({
  title: true,
  body: true,
  pros: true,
  cons: true,
  tips: true,
  valueForMoney: true,
  cleanliness: true,
  parking: true,
  accessibility: true,
  familyFriendliness: true,
  foodExperience: true,
  shoppingExperience: true,
  serviceExperience: true,
  safetyAwareness: true,
  visitRecency: true,
  mediaIds: true,
});
export type SubmitCommunityOpinionInput = z.infer<typeof SubmitCommunityOpinionInput>;

export const VoteType = z.enum(["HELPFUL", "NOT_HELPFUL", "REPORT"]);
export type VoteType = z.infer<typeof VoteType>;

export const CommunityVoteInput = z.object({
  opinionId: z.string(),
  voteType: VoteType,
  reportReason: z.string().max(500).optional(),
});
export type CommunityVoteInput = z.infer<typeof CommunityVoteInput>;

/** "I was here" check-in. Precise coordinates are NEVER persisted long-term. */
export const CheckInInput = z.object({
  entityId: z.string(),
  visitRecency: VisitRecency,
});
export type CheckInInput = z.infer<typeof CheckInInput>;
