import { logger } from "@/platform/observability/logger";

export async function startWorker() {
  logger.info("OHMS worker bootstrapped");
}

if (require.main === module) {
  startWorker().catch((error) => {
    logger.error({ err: error }, "Worker bootstrap failed");
    process.exit(1);
  });
}
