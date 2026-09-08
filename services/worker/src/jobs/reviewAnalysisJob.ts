import type { Job } from "bullmq";
import { refreshReviewsForEntity } from "@locaguide/runtime";
import { childLogger } from "@locaguide/shared";
import type { ReviewAnalysisJobData } from "../queues";

const log = childLogger({ component: "reviewAnalysisJob" });

/**
 * Runs the review-engine pipeline for one entity (section 7/25). This is
 * the async counterpart to the synchronous refresh the API triggers
 * on-demand for small demo datasets - at production scale, the API should
 * only enqueue this job and serve the last-computed signals from cache/DB.
 */
export async function processReviewAnalysis(job: Job<ReviewAnalysisJobData>): Promise<void> {
  log.info({ jobId: job.id, entityId: job.data.entityId }, "Running review analysis");
  const signals = await refreshReviewsForEntity(job.data.entityId);
  log.info({ jobId: job.id, entityId: job.data.entityId, signalCount: signals.length }, "Review analysis complete");
}
