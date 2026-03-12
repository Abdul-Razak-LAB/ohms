import { NextRequest } from "next/server";
import { withApiHandler } from "@/common/api/handler";
import { AppError } from "@/common/errors/app-error";
import { runJobSafely } from "@/worker/jobs/job-runner";

export async function POST(request: NextRequest) {
  return withApiHandler(async () => {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token || token !== process.env.UPSTASH_QSTASH_TOKEN) {
      throw new AppError("AUTH_UNAUTHORIZED", "Invalid QStash token", 401);
    }

    const body = await request.json();
    const payload = body?.job;
    if (!payload?.name) {
      throw new AppError("VAL_INVALID_PAYLOAD", "Missing job payload", 422);
    }

    const result = await runJobSafely(payload);
    return { accepted: true, job: payload.name, result };
  });
}
