import { logger } from "@/platform/observability/logger";
import * as Sentry from "@sentry/nextjs";
import { runJobSafely } from "@/worker/jobs/job-runner";

export async function startWorker() {
  logger.info("OHMS worker bootstrapped");

  const raw = process.env.WORKER_JOB_PAYLOAD;
  if (!raw) {
    logger.info("No WORKER_JOB_PAYLOAD provided; worker is idle");
    return;
  }

  const payload = JSON.parse(raw) as { name: "document-ocr" | "voice-transcription" | "exception-detection"; homeId?: string; attachmentId?: string };
  await runJobSafely(payload);
}

if (require.main === module) {
  startWorker().catch((error) => {
    Sentry.captureException(error);
    logger.error({ err: error }, "Worker bootstrap failed");
    process.exit(1);
  });
}
