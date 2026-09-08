import { Router } from "express";
import { AddSavedLocationInput, UpdatePreferencesInput } from "@locaguide/contracts";
import { NotFoundError } from "@locaguide/shared";
import { prisma } from "@locaguide/db";
import { addSavedLocation, deleteSavedLocation, listSavedLocations } from "@locaguide/runtime";
import { asyncHandler } from "../middleware/asyncHandler";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { recordAudit } from "../services/auditService";

export const usersRouter = Router();

usersRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user || user.deletedAt) throw new NotFoundError("USER_NOT_FOUND", "User not found.");
    res.json({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      createdAt: user.createdAt,
    });
  }),
);

usersRouter.get(
  "/me/preferences",
  requireAuth,
  asyncHandler(async (req, res) => {
    const preference = await prisma.preference.findUnique({ where: { userId: req.user!.id } });
    res.json(
      preference ?? {
        userId: req.user!.id,
        budgetLevel: null,
        travelingWithFamily: null,
        interests: [],
        accessibilityRequirements: [],
        dietaryPreferences: [],
        preferredLanguage: "en",
      },
    );
  }),
);

usersRouter.put(
  "/me/preferences",
  requireAuth,
  validateBody(UpdatePreferencesInput),
  asyncHandler(async (req, res) => {
    const updated = await prisma.preference.upsert({
      where: { userId: req.user!.id },
      create: { userId: req.user!.id, ...req.body },
      update: req.body,
    });
    res.json(updated);
  }),
);

/** Section 11/18: users can delete/reset their personalization data at any time. */
usersRouter.delete(
  "/me/preferences",
  requireAuth,
  asyncHandler(async (req, res) => {
    await prisma.preference.deleteMany({ where: { userId: req.user!.id } });
    res.status(204).send();
  }),
);

/** Section 18: user-initiated account deletion. Soft-deletes and anonymizes identifying fields. */
usersRouter.delete(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    await prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
        email: `deleted-${userId}@example.invalid`,
        displayName: "Deleted user",
      },
    });
    await recordAudit({
      actorId: userId,
      action: "DATA_DELETION",
      resource: "users/me",
      result: "SUCCESS",
      requestId: req.requestId,
      correlationId: req.correlationId,
    });
    res.status(204).send();
  }),
);

/** Section 18: data export. Returns the user's own data as a single JSON document. */
usersRouter.get(
  "/me/export",
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const [user, preference, opinions, checkIns, savedLocations] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.preference.findUnique({ where: { userId } }),
      prisma.communityOpinion.findMany({ where: { userId } }),
      prisma.checkIn.findMany({ where: { userId } }),
      listSavedLocations(userId),
    ]);
    await recordAudit({
      actorId: userId,
      action: "DATA_EXPORT",
      resource: "users/me/export",
      result: "SUCCESS",
      requestId: req.requestId,
      correlationId: req.correlationId,
    });
    res.json({
      user: user ? { id: user.id, email: user.email, displayName: user.displayName, createdAt: user.createdAt } : null,
      preference,
      opinions,
      checkIns,
      savedLocations,
    });
  }),
);

/**
 * Section 48: saved/"interested" locations. Accepts an existing entityId
 * (quick "save this place"), and/or a pasted Google Maps link (short links
 * are resolved via redirect, then parsed for name/coordinates - see
 * packages/runtime/src/savedLocationService.ts), and/or a manual label.
 */
usersRouter.get(
  "/me/saved-locations",
  requireAuth,
  asyncHandler(async (req, res) => {
    const items = await listSavedLocations(req.user!.id);
    res.json({ items });
  }),
);

usersRouter.post(
  "/me/saved-locations",
  requireAuth,
  validateBody(AddSavedLocationInput),
  asyncHandler(async (req, res) => {
    const saved = await addSavedLocation(req.user!.id, req.body);
    res.status(201).json(saved);
  }),
);

usersRouter.delete(
  "/me/saved-locations/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    await deleteSavedLocation(req.user!.id, req.params.id!);
    res.status(204).send();
  }),
);
