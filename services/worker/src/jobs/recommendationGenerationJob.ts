import type { Job } from "bullmq";
import { generateBriefing } from "@locaguide/runtime";
import { childLogger } from "@locaguide/shared";
import type { RecommendationGenerationJobData } from "../queues";

const log = childLogger({ component: "recommendationGenerationJob" });

/**
 * Pre-generates an evidence-based briefing for an entity (section 25/43),
 * e.g. after new reviews/opinions arrive, so the next user request is
 * served from cache instead of computing synchronously.
 */
export async function processRecommendationGeneration(job: Job<RecommendationGenerationJobData>): Promise<void> {
  log.info({ jobId: job.id, entityId: job.data.entityId }, "Generating recommendation briefing");
  const evidence = await generateBriefing(job.data.entityId, job.data.userId);
  log.info({ jobId: job.id, entityId: job.data.entityId, evidenceCount: evidence.length }, "Briefing generated");
}
