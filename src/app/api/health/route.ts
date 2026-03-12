import { NextResponse } from "next/server";
import { prisma } from "@/platform/db/prisma";

export async function GET() {
  let db = "down";
  try {
    await prisma.$queryRaw`SELECT 1`;
    db = "up";
  } catch {
    db = "down";
  }

  return NextResponse.json({
    success: true,
    data: {
      status: db === "up" ? "ok" : "degraded",
      checks: {
        db,
        redis: process.env.UPSTASH_REDIS_REST_URL ? "configured" : "not-configured",
        storage: process.env.R2_BUCKET ? "configured" : "not-configured",
        email: process.env.RESEND_API_KEY ? "configured" : "not-configured",
        payment: process.env.PAYMENT_PROVIDER || "mock"
      }
    }
  });
}
