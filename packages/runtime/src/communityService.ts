import type {
  CheckInInput,
  CommunityOpinion,
  CommunityVoteInput,
  SubmitCommunityOpinionInput,
} from "@locaguide/contracts";
import { computeModerationSignal, decideModerationAction } from "@locaguide/domain";
import { AppError, NotFoundError } from "@locaguide/shared";
import type { CommunityOpinion as PrismaCommunityOpinion } from "@locaguide/db";
import { prisma } from "@locaguide/db";
import { buildProviderRegistry } from "./registry";

function toPublicOpinion(row: PrismaCommunityOpinion): CommunityOpinion {
  return {
    id: row.id,
    userId: row.userId,
    entityId: row.entityId,
    rating: row.rating,
    title: row.title,
    body: row.body,
    pros: row.pros,
    cons: row.cons,
    tips: row.tips,
    valueForMoney: row.valueForMoney,
    cleanliness: row.cleanliness,
    parking: row.parking,
    accessibility: row.accessibility,
    familyFriendliness: row.familyFriendliness,
    foodExperience: row.foodExperience,
    shoppingExperience: row.shoppingExperience,
    serviceExperience: row.serviceExperience,
    safetyAwareness: row.safetyAwareness,
    visitRecency: row.visitRecency,
    verifiedVisit: row.verifiedVisit,
    mediaIds: [],
    helpfulCount: row.helpfulCount,
    reportCount: row.reportCount,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    editedAt: row.editedAt?.toISOString() ?? null,
  };
}

export async function submitOpinion(userId: string, input: SubmitCommunityOpinionInput): Promise<CommunityOpinion> {
  const entity = await prisma.entity.findUnique({ where: { id: input.entityId } });
  if (!entity) throw new NotFoundError("LOCATION_NOT_FOUND", "Location could not be identified.");

  const text = [input.title, input.body, ...(input.pros ?? []), ...(input.cons ?? []), ...(input.tips ?? [])]
    .filter(Boolean)
    .join(". ");
  const priorTexts = (
    await prisma.communityOpinion.findMany({ where: { userId }, select: { body: true }, take: 50 })
  )
    .map((o) => o.body)
    .filter((b): b is string => Boolean(b));

  const signal = computeModerationSignal({ text, priorTextsBySameAuthor: priorTexts });
  const { policyEngine } = buildProviderRegistry();
  const decision = decideModerationAction(signal, 0, policyEngine.moderationThresholds());

  const moderationStatus = decision === "AUTO_HIDE" ? "AUTO_HIDDEN" : decision === "QUEUE_FOR_REVIEW" ? "PENDING" : "APPROVED";

  const created = await prisma.communityOpinion.create({
    data: {
      userId,
      entityId: input.entityId,
      rating: input.rating,
      title: input.title ?? null,
      body: input.body ?? null,
      pros: input.pros ?? [],
      cons: input.cons ?? [],
      tips: input.tips ?? [],
      valueForMoney: input.valueForMoney ?? null,
      cleanliness: input.cleanliness ?? null,
      parking: input.parking ?? null,
      accessibility: input.accessibility ?? null,
      familyFriendliness: input.familyFriendliness ?? null,
      foodExperience: input.foodExperience ?? null,
      shoppingExperience: input.shoppingExperience ?? null,
      serviceExperience: input.serviceExperience ?? null,
      safetyAwareness: input.safetyAwareness ?? null,
      visitRecency: input.visitRecency ?? null,
      moderationStatus,
    },
  });

  if (decision !== "ALLOW") {
    await prisma.moderationCase.create({
      data: {
        targetType: "COMMUNITY_OPINION",
        targetId: created.id,
        status: "OPEN",
        spamScore: signal.spamScore,
        signals: signal,
      },
    });
  }

  return toPublicOpinion(created);
}

export async function listOpinionsForEntity(
  entityId: string,
  page: number,
  pageSize: number,
): Promise<{ items: CommunityOpinion[]; total: number }> {
  const where = { entityId, status: { in: ["ACTIVE" as const, "EDITED" as const] }, moderationStatus: "APPROVED" as const };
  const [rows, total] = await Promise.all([
    prisma.communityOpinion.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.communityOpinion.count({ where }),
  ]);
  return { items: rows.map(toPublicOpinion), total };
}

export async function voteOnOpinion(userId: string, input: CommunityVoteInput): Promise<void> {
  const opinion = await prisma.communityOpinion.findUnique({ where: { id: input.opinionId } });
  if (!opinion) throw new NotFoundError("OPINION_NOT_FOUND", "Community opinion not found.");

  const existing = await prisma.communityVote.findUnique({
    where: { userId_opinionId_voteType: { userId, opinionId: input.opinionId, voteType: input.voteType } },
  });
  if (existing) {
    throw new AppError("ALREADY_VOTED", "You have already submitted this vote for this opinion.", 409);
  }

  await prisma.communityVote.create({
    data: { userId, opinionId: input.opinionId, voteType: input.voteType, reportReason: input.reportReason },
  });

  if (input.voteType === "HELPFUL") {
    await prisma.communityOpinion.update({ where: { id: input.opinionId }, data: { helpfulCount: { increment: 1 } } });
  }

  if (input.voteType === "REPORT") {
    const updated = await prisma.communityOpinion.update({
      where: { id: input.opinionId },
      data: { reportCount: { increment: 1 } },
    });
    await prisma.report.create({
      data: {
        reporterUserId: userId,
        targetType: "COMMUNITY_OPINION",
        targetId: input.opinionId,
        reason: input.reportReason ?? "Not specified",
      },
    });

    const { policyEngine } = buildProviderRegistry();
    const signal = computeModerationSignal({ text: opinion.body ?? "" });
    const decision = decideModerationAction(signal, updated.reportCount, policyEngine.moderationThresholds());
    if (decision === "QUEUE_FOR_REVIEW") {
      await prisma.moderationCase.upsert({
        where: { id: `${input.opinionId}-report` },
        create: {
          id: `${input.opinionId}-report`,
          targetType: "COMMUNITY_OPINION",
          targetId: input.opinionId,
          status: "OPEN",
          spamScore: signal.spamScore,
          signals: signal,
        },
        update: { status: "OPEN" },
      });
    }
  }
}

export async function checkIn(userId: string, input: CheckInInput): Promise<{ id: string }> {
  const entity = await prisma.entity.findUnique({ where: { id: input.entityId } });
  if (!entity) throw new NotFoundError("LOCATION_NOT_FOUND", "Location could not be identified.");
  const created = await prisma.checkIn.create({
    data: { userId, entityId: input.entityId, visitRecency: input.visitRecency },
  });
  return { id: created.id };
}
