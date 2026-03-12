import { logger } from "@/platform/observability/logger";

export async function runVoiceTranscriptionJob(attachmentId: string) {
  logger.info({ attachmentId }, "Running voice transcription job");
  return { attachmentId, status: "completed" as const };
}
