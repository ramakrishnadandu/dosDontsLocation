import { Router } from "express";
import { CheckInInput, CommunityVoteInput, SubmitCommunityOpinionInput } from "@locaguide/contracts";
import { asyncHandler } from "../middleware/asyncHandler";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { checkIn, submitOpinion, voteOnOpinion } from "@locaguide/runtime";

export const communityRouter = Router();

communityRouter.post(
  "/opinions",
  requireAuth,
  validateBody(SubmitCommunityOpinionInput),
  asyncHandler(async (req, res) => {
    const opinion = await submitOpinion(req.user!.id, req.body);
    res.status(201).json(opinion);
  }),
);

communityRouter.post(
  "/votes",
  requireAuth,
  validateBody(CommunityVoteInput),
  asyncHandler(async (req, res) => {
    await voteOnOpinion(req.user!.id, req.body);
    res.status(204).send();
  }),
);

communityRouter.post(
  "/check-ins",
  requireAuth,
  validateBody(CheckInInput),
  asyncHandler(async (req, res) => {
    const result = await checkIn(req.user!.id, req.body);
    res.status(201).json(result);
  }),
);
