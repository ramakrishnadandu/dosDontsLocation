import type { Job } from "bullmq";
import { childLogger } from "@locaguide/shared";

const log = childLogger({ component: "notImplementedJob" });

/**
 * Placeholder processor for queues that are architecturally wired up
 * (registered, monitorable, retryable) but whose integration depends on a
 * genuinely external system not available in this environment - e.g.
 * product_sync/location_sync need a real ProductProvider/LocationProvider
 * credential, image_processing needs an object-storage + malware-scanning
 * backend, notifications needs a push provider. See docs/architecture.md
 * for the concrete follow-up per queue.
 */
export async function notImplementedProcessor(job: Job): Promise<void> {
  log.warn({ jobId: job.id, queue: job.queueName }, "Job type not yet implemented - see docs/architecture.md#jobs");
}
