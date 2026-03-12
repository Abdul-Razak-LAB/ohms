import { logger } from "@/platform/observability/logger";

export async function runDocumentOcrJob(attachmentId: string) {
  logger.info({ attachmentId }, "Running document OCR job");
  return { attachmentId, status: "completed" as const };
}
