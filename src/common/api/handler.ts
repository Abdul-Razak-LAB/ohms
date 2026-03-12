import { NextRequest, NextResponse } from "next/server";
import { fail } from "@/common/api/envelope";
import { AppError } from "@/common/errors/app-error";
import { logger } from "@/platform/observability/logger";
import * as Sentry from "@sentry/nextjs";

export async function withApiHandler<T>(fn: () => Promise<T>) {
  try {
    const data = await fn();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const body = fail(error);
    const status = error instanceof AppError ? error.status : 500;
    if (!(error instanceof AppError) || status >= 500) {
      Sentry.captureException(error);
    }
    logger.error({ err: error, code: body.error.code }, "API handler failure");
    return NextResponse.json(body, { status });
  }
}

export function requireJson(request: NextRequest) {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new AppError("VAL_INVALID_CONTENT_TYPE", "Expected application/json", 415);
  }
}
