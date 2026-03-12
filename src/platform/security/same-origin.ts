import { NextRequest } from "next/server";
import { AppError } from "@/common/errors/app-error";
import { env } from "@/platform/config/env";

export function requireSameOrigin(request: NextRequest) {
  const method = request.method.toUpperCase();
  if (["GET", "HEAD", "OPTIONS"].includes(method)) return;

  const origin = request.headers.get("origin");
  if (!origin || origin !== env.APP_URL) {
    throw new AppError("SEC_ORIGIN_MISMATCH", "Invalid request origin", 403);
  }
}
