import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";

describe("payment webhook verification", () => {
  it("validates signed webhook payload", async () => {
    process.env.APP_URL = "https://example.com";
    process.env.DATABASE_URL = "postgres://user:pass@localhost:5432/ohms";
    process.env.SESSION_SECRET = "1234567890123456";
    process.env.SESSION_COOKIE_NAME = "ohms_session";
    process.env.PAYMENT_PROVIDER = "stripe";
    process.env.PAYMENT_WEBHOOK_SECRET = "test-secret";

    const body = JSON.stringify({ type: "payment.succeeded" });
    const signature = createHmac("sha256", "test-secret").update(body).digest("hex");

    const { verifyPaymentWebhookSignature, parsePaymentWebhook } = await import("@/modules/finance/payments/payment-gateway");

    expect(verifyPaymentWebhookSignature(body, signature)).toBe(true);
    expect(parsePaymentWebhook(body)).toMatchObject({ eventType: "payment.succeeded" });
  });
});
