import { Router } from "express";
import { z } from "zod";
import { prisma } from "@locaguide/db";
import { asyncHandler } from "../middleware/asyncHandler";
import { requireAuth, requireRole } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { recordAudit } from "../services/auditService";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole("SUPER_ADMIN", "ADMIN", "MODERATOR", "ANALYST", "SUPPORT"));

/** Moderation queue (section 17/20). */
adminRouter.get(
  "/moderation/cases",
  requireRole("SUPER_ADMIN", "ADMIN", "MODERATOR"),
  asyncHandler(async (req, res) => {
    const status = (req.query.status as string) ?? "OPEN";
    const cases = await prisma.moderationCase.findMany({
      where: { status: status as never },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    res.json({ items: cases });
  }),
);

const ResolveModerationInput = z.object({
  status: z.enum(["RESOLVED_APPROVED", "RESOLVED_REJECTED"]),
  resolution: z.string().max(1000).optional(),
});

adminRouter.post(
  "/moderation/cases/:id/resolve",
  requireRole("SUPER_ADMIN", "ADMIN", "MODERATOR"),
  validateBody(ResolveModerationInput),
  asyncHandler(async (req, res) => {
    const moderationCase = await prisma.moderationCase.update({
      where: { id: req.params.id! },
      data: { status: req.body.status, resolution: req.body.resolution, assignedModeratorId: req.user!.id },
    });

    if (moderationCase.targetType === "COMMUNITY_OPINION") {
      await prisma.communityOpinion.update({
        where: { id: moderationCase.targetId },
        data: { moderationStatus: req.body.status === "RESOLVED_APPROVED" ? "APPROVED" : "REJECTED" },
      });
    }

    await recordAudit({
      actorId: req.user!.id,
      action: "MODERATION_ACTION",
      resource: `moderation_cases/${req.params.id}`,
      result: "SUCCESS",
      requestId: req.requestId,
      correlationId: req.correlationId,
    });

    res.json(moderationCase);
  }),
);

/** Reports (section 17/20). */
adminRouter.get(
  "/reports",
  requireRole("SUPER_ADMIN", "ADMIN", "MODERATOR"),
  asyncHandler(async (req, res) => {
    const status = (req.query.status as string) ?? "OPEN";
    const reports = await prisma.report.findMany({
      where: { status: status as never },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    res.json({ items: reports });
  }),
);

/** Audit log (section 22). Read-only, never exposes secrets. */
adminRouter.get(
  "/audit-logs",
  requireRole("SUPER_ADMIN", "ADMIN", "ANALYST"),
  asyncHandler(async (req, res) => {
    const logs = await prisma.auditLog.findMany({ orderBy: { timestamp: "desc" }, take: 200 });
    res.json({ items: logs });
  }),
);

/** Feature flags (section 20/21). */
adminRouter.get(
  "/feature-flags",
  asyncHandler(async (_req, res) => {
    const flags = await prisma.featureFlag.findMany();
    res.json({ items: flags });
  }),
);

const UpsertFeatureFlagInput = z.object({
  key: z.string().min(1).max(100),
  enabled: z.boolean(),
  description: z.string().max(500).optional(),
});

adminRouter.put(
  "/feature-flags/:key",
  requireRole("SUPER_ADMIN", "ADMIN"),
  validateBody(UpsertFeatureFlagInput.omit({ key: true })),
  asyncHandler(async (req, res) => {
    const flag = await prisma.featureFlag.upsert({
      where: { key: req.params.key! },
      create: { key: req.params.key!, ...req.body },
      update: req.body,
    });
    await recordAudit({
      actorId: req.user!.id,
      action: "ADMIN_ACTION",
      resource: `feature_flags/${req.params.key}`,
      result: "SUCCESS",
      requestId: req.requestId,
      correlationId: req.correlationId,
    });
    res.json(flag);
  }),
);

/** Users list (section 20), minimal fields only - never returns password hashes. */
adminRouter.get(
  "/users",
  requireRole("SUPER_ADMIN", "ADMIN", "SUPPORT"),
  asyncHandler(async (_req, res) => {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, displayName: true, role: true, createdAt: true, deletedAt: true },
      take: 200,
      orderBy: { createdAt: "desc" },
    });
    res.json({ items: users });
  }),
);

const ChangeRoleInput = z.object({
  role: z.enum(["SUPER_ADMIN", "ADMIN", "MODERATOR", "ANALYST", "SUPPORT", "USER"]),
});

adminRouter.put(
  "/users/:id/role",
  requireRole("SUPER_ADMIN"),
  validateBody(ChangeRoleInput),
  asyncHandler(async (req, res) => {
    const user = await prisma.user.update({ where: { id: req.params.id! }, data: { role: req.body.role } });
    await recordAudit({
      actorId: req.user!.id,
      action: "ROLE_CHANGE",
      resource: `users/${req.params.id}`,
      result: "SUCCESS",
      requestId: req.requestId,
      correlationId: req.correlationId,
    });
    res.json({ id: user.id, role: user.role });
  }),
);
