import { Router } from "express";
import { z } from "zod";
import { LoginInput, RegisterInput } from "@locaguide/contracts";
import { login, refresh, register } from "../services/authService";
import { recordAudit } from "../services/auditService";
import { asyncHandler } from "../middleware/asyncHandler";
import { validateBody } from "../middleware/validate";
import { authRateLimiter } from "../middleware/rateLimit";

export const authRouter = Router();

authRouter.post(
  "/register",
  authRateLimiter,
  validateBody(RegisterInput),
  asyncHandler(async (req, res) => {
    const tokens = await register(req.body);
    await recordAudit({
      actorId: tokens.userId,
      action: "LOGIN",
      resource: "auth/register",
      result: "SUCCESS",
      requestId: req.requestId,
      correlationId: req.correlationId,
    });
    res.status(201).json(tokens);
  }),
);

authRouter.post(
  "/login",
  authRateLimiter,
  validateBody(LoginInput),
  asyncHandler(async (req, res) => {
    const tokens = await login(req.body);
    await recordAudit({
      actorId: tokens.userId,
      action: "LOGIN",
      resource: "auth/login",
      result: "SUCCESS",
      requestId: req.requestId,
      correlationId: req.correlationId,
    });
    res.status(200).json(tokens);
  }),
);

const RefreshInput = z.object({ refreshToken: z.string().min(1) });

authRouter.post(
  "/refresh",
  authRateLimiter,
  validateBody(RefreshInput),
  asyncHandler(async (req, res) => {
    const tokens = await refresh(req.body.refreshToken);
    res.status(200).json(tokens);
  }),
);
