import { createHmac, timingSafeEqual } from "node:crypto";
import { AppError } from "@/common/errors/app-error";
import { env } from "@/platform/config/env";

export type PaymentWebhook = {
  provider: string;
  eventType: string;
  payload: unknown;
};

function toSafeBuffer(value: string) {
  return Buffer.from(value, "utf8");
}

export function verifyPaymentWebhookSignature(rawBody: string, signature: string | null) {
  const secret = env.PAYMENT_WEBHOOK_SECRET;
  if (!secret) {
    if (env.PAYMENT_PROVIDER === "mock") {
      return true;
    }
    throw new AppError("EXT_PAYMENT_WEBHOOK_MISCONFIGURED", "Missing payment webhook secret", 500);
  }

  if (!signature) {
    throw new AppError("EXT_PAYMENT_WEBHOOK_INVALID_SIGNATURE", "Missing payment signature", 401);
  }

  const expectedHex = createHmac(env.PAYMENT_WEBHOOK_ALGO, secret).update(rawBody).digest("hex");
  const providedHex = signature.trim();
  const expected = toSafeBuffer(expectedHex);
  const provided = toSafeBuffer(providedHex);

  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) {
    throw new AppError("EXT_PAYMENT_WEBHOOK_INVALID_SIGNATURE", "Invalid payment signature", 401);
  }

  return true;
}

export function parsePaymentWebhook(rawBody: string): PaymentWebhook {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    throw new AppError("VAL_INVALID_PAYLOAD", "Invalid webhook JSON payload", 422);
  }

  const data = parsed as { type?: string; provider?: string };
  return {
    provider: data.provider || env.PAYMENT_PROVIDER,
    eventType: data.type || "unknown",
    payload: parsed
  };
}
