import { NextRequest } from "next/server";
import { withApiHandler } from "@/common/api/handler";
import { AppError } from "@/common/errors/app-error";

export async function POST(request: NextRequest) {
  return withApiHandler(async () => {
    const signature = request.headers.get("x-payment-signature");
    if (!signature || signature !== process.env.PAYMENT_WEBHOOK_SECRET) {
      throw new AppError("EXT_PAYMENT_WEBHOOK_INVALID_SIGNATURE", "Invalid payment signature", 401);
    }

    const payload = await request.json();

    return {
      accepted: true,
      provider: process.env.PAYMENT_PROVIDER || "mock",
      eventType: payload?.type || "unknown"
    };
  });
}
