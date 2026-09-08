import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

// Ensures DATABASE_URL is present even if this module is imported before
// @locaguide/config runs its own dotenv.config() - import order should not
// matter for something as fundamental as the DB connection string.
dotenv.config();

/**
 * Single shared Prisma client for the whole monorepo. Both services/api and
 * services/worker import this - never instantiate PrismaClient elsewhere,
 * doing so per-request/per-job exhausts the connection pool under load.
 */
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});
