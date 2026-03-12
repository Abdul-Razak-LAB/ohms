import { NextRequest } from "next/server";
import { withApiHandler } from "@/common/api/handler";
import { AppError } from "@/common/errors/app-error";

export async function POST(request: NextRequest) {
  return withApiHandler(async () => {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token || token !== process.env.UPSTASH_QSTASH_TOKEN) {
      throw new AppError("AUTH_UNAUTHORIZED", "Invalid QStash token", 401);
    }

    const body = await request.json();
    return { accepted: true, job: body?.job || "unknown" };
  });
}
