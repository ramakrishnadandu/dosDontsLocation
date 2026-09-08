import { Worker } from "bullmq";
import IORedis from "ioredis";
import { loadEnv } from "@locaguide/config";
import { logger } from "@locaguide/shared";
import { QUEUE_NAMES } from "./queues";
import { processReviewAnalysis } from "./jobs/reviewAnalysisJob";
import { processRecommendationGeneration } from "./jobs/recommendationGenerationJob";
import { notImplementedProcessor } from "./jobs/notImplementedJob";

const env = loadEnv();
const connection = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });

const IMPLEMENTED_QUEUES = [QUEUE_NAMES.reviewAnalysis, QUEUE_NAMES.recommendationGeneration] as const;
const PLACEHOLDER_QUEUES = Object.values(QUEUE_NAMES).filter(
  (q) => !(IMPLEMENTED_QUEUES as readonly string[]).includes(q),
);

const workers = [
  new Worker(QUEUE_NAMES.reviewAnalysis, processReviewAnalysis, { connection }),
  new Worker(QUEUE_NAMES.recommendationGeneration, processRecommendationGeneration, { connection }),
  ...PLACEHOLDER_QUEUES.map((queueName) => new Worker(queueName, notImplementedProcessor, { connection })),
];

for (const worker of workers) {
  worker.on("completed", (job) => logger.info({ queue: worker.name, jobId: job.id }, "Job completed"));
  worker.on("failed", (job, err) =>
    logger.error({ queue: worker.name, jobId: job?.id, err: err.message }, "Job failed"),
  );
}

logger.info({ queues: Object.values(QUEUE_NAMES) }, "LocaGuide worker started");

const shutdown = async (signal: string) => {
  logger.info({ signal }, "Worker shutting down gracefully");
  await Promise.all(workers.map((w) => w.close()));
  connection.disconnect();
  process.exit(0);
};

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
