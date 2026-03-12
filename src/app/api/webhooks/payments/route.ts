import { NextRequest } from "next/server";
import { withApiHandler } from "@/common/api/handler";
import { parsePaymentWebhook, verifyPaymentWebhookSignature } from "@/modules/finance/payments/payment-gateway";

export async function POST(request: NextRequest) {
  return withApiHandler(async () => {
    const signature = request.headers.get("x-payment-signature");
    const raw = await request.text();
    verifyPaymentWebhookSignature(raw, signature);
    const payload = parsePaymentWebhook(raw);

    return {
      accepted: true,
      provider: payload.provider,
      eventType: payload.eventType
    };
  });
}
