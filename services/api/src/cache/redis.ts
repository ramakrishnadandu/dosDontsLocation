import Redis from "ioredis";
import { loadEnv } from "@locaguide/config";
import { childLogger } from "@locaguide/shared";

const log = childLogger({ component: "redis" });

let client: Redis | undefined;

/**
 * Shared Redis client for API caching, rate limiting, and job coordination
 * (see section 24 - Redis is never the source of truth, only cache/queue).
 */
export function getRedis(): Redis {
  if (client) return client;
  const env = loadEnv();
  client = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    lazyConnect: false,
  });
  client.on("error", (err) => log.error({ err: err.message }, "Redis connection error"));
  return client;
}

const DEFAULT_TTL_SECONDS = 60;

export async function cacheGetOrSet<T>(key: string, ttlSeconds: number, compute: () => Promise<T>): Promise<T> {
  const redis = getRedis();
  const cached = await redis.get(key);
  if (cached) {
    try {
      return JSON.parse(cached) as T;
    } catch {
      // fall through and recompute on corrupt cache entry
    }
  }
  const value = await compute();
  await redis.set(key, JSON.stringify(value), "EX", ttlSeconds ?? DEFAULT_TTL_SECONDS);
  return value;
}
