import * as Sentry from "@sentry/nextjs";
import { logger } from "@/platform/observability/logger";
import { runDocumentOcrJob } from "@/worker/jobs/document-ocr.job";
import { runVoiceTranscriptionJob } from "@/worker/jobs/voice-transcription.job";
import { runExceptionDetectionJob } from "@/worker/jobs/exception-detection.job";
import { AppError } from "@/common/errors/app-error";

type JobPayload = {
  name: "document-ocr" | "voice-transcription" | "exception-detection";
  homeId?: string;
  attachmentId?: string;
};

export async function runJob(payload: JobPayload) {
  switch (payload.name) {
    case "document-ocr": {
      if (!payload.attachmentId) {
        throw new AppError("JOB_INVALID_PAYLOAD", "attachmentId is required for document-ocr", 422);
      }
      return runDocumentOcrJob(payload.attachmentId);
    }
    case "voice-transcription": {
      if (!payload.attachmentId) {
        throw new AppError("JOB_INVALID_PAYLOAD", "attachmentId is required for voice-transcription", 422);
      }
      return runVoiceTranscriptionJob(payload.attachmentId);
    }
    case "exception-detection": {
      if (!payload.homeId) {
        throw new AppError("JOB_INVALID_PAYLOAD", "homeId is required for exception-detection", 422);
      }
      return runExceptionDetectionJob(payload.homeId);
    }
    default:
      throw new AppError("JOB_NOT_SUPPORTED", `Unsupported job '${(payload as { name?: string }).name || "unknown"}'`, 422);
  }
}

export async function runJobSafely(payload: JobPayload) {
  try {
    return await runJob(payload);
  } catch (error) {
    Sentry.captureException(error);
    logger.error({ err: error, payload }, "Worker job failed");
    throw error;
  }
}
