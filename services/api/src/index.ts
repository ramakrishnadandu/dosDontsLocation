import { loadEnv } from "@locaguide/config";
import { logger } from "@locaguide/shared";
import { createApp } from "./app";
import { prisma } from "@locaguide/db";
import { getRedis } from "./cache/redis";

async function main(): Promise<void> {
  const env = loadEnv();
  const app = createApp();

  const server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT, env: env.NODE_ENV }, "LocaGuide API listening");
  });

  const shutdown = async (signal: string) => {
    logger.info({ signal }, "Shutting down gracefully");
    server.close();
    await prisma.$disconnect();
    getRedis().disconnect();
    process.exit(0);
  };

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Fatal startup error:", err);
  process.exit(1);
});
