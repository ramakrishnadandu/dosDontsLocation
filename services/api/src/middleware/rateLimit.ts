import rateLimit from "express-rate-limit";
import { RateLimitError } from "@locaguide/shared";

/**
 * In-memory rate limiting suitable for a single instance / local dev.
 * For horizontal scaling in production, replace the store with a
 * Redis-backed store (e.g. rate-limit-redis) so limits are shared across
 * replicas - see docs/deployment.md.
 */
export const standardRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  handler: () => {
    throw new RateLimitError();
  },
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: () => {
    throw new RateLimitError("Too many authentication attempts. Try again later.");
  },
});
