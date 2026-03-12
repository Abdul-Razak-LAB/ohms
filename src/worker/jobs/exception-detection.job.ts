import { logger } from "@/platform/observability/logger";

export async function runExceptionDetectionJob(homeId: string) {
  logger.info({ homeId }, "Running exception detection job");
  return { homeId, anomalies: [] as string[] };
}
