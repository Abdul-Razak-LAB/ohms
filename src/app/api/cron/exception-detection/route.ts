import { withApiHandler } from "@/common/api/handler";
import { runExceptionDetectionJob } from "@/worker/jobs/exception-detection.job";

export async function POST(request: Request) {
  return withApiHandler(async () => {
    const body = await request.json().catch(() => ({}));
    const homeId = typeof body?.homeId === "string" ? body.homeId : null;
    if (!homeId) {
      throw new Error("homeId is required");
    }

    const result = await runExceptionDetectionJob(homeId);
    return { scheduled: true, result };
  });
}
