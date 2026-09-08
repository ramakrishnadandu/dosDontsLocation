import { Router } from "express";
import { prisma } from "@locaguide/db";
import { getRedis } from "../cache/redis";
import { asyncHandler } from "../middleware/asyncHandler";

export const healthRouter = Router();

/** Liveness: process is up. Never checks dependencies - used by orchestrators to decide restarts. */
healthRouter.get("/livez", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

/** Readiness: dependencies are reachable - used by orchestrators/load balancers to gate traffic. */
healthRouter.get(
  "/readyz",
  asyncHandler(async (_req, res) => {
    const checks: Record<string, "ok" | "error"> = { database: "ok", redis: "ok" };

    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      checks.database = "error";
    }

    try {
      await getRedis().ping();
    } catch {
      checks.redis = "error";
    }

    const healthy = Object.values(checks).every((v) => v === "ok");
    res.status(healthy ? 200 : 503).json({ status: healthy ? "ok" : "degraded", checks });
  }),
);

healthRouter.get("/healthz", (_req, res) => {
  res.status(200).json({ status: "ok" });
});
