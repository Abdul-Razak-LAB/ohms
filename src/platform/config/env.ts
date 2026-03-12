import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.string().url(),
  DATABASE_URL: z.string().min(1),
  SESSION_SECRET: z.string().min(16),
  SESSION_COOKIE_NAME: z.string().min(1),

  R2_ACCOUNT_ID: z.string().optional(),
  R2_ENDPOINT: z.string().url().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET: z.string().optional(),
  R2_PUBLIC_URL: z.string().optional(),

  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM: z.string().email().optional(),

  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  UPSTASH_QSTASH_TOKEN: z.string().optional(),

  PAYMENT_PROVIDER: z.string().default("mock"),
  PAYMENT_WEBHOOK_ALGO: z.enum(["sha256"]).default("sha256"),
  PAYMENT_WEBHOOK_SECRET: z.string().optional(),

  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_SUBJECT: z.string().optional(),

  SENTRY_DSN: z.string().optional(),
  CRON_SECRET: z.string().optional()
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment", parsed.error.flatten().fieldErrors);
  throw new Error("Environment validation failed");
}

export const env = parsed.data;

function hasAny(keys: Array<keyof typeof env>) {
  return keys.some((key) => Boolean(env[key]));
}

function hasAll(keys: Array<keyof typeof env>) {
  return keys.every((key) => Boolean(env[key]));
}

const optionalGroups: Record<string, Array<keyof typeof env>> = {
  r2: ["R2_ACCOUNT_ID", "R2_ENDPOINT", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET"],
  resend: ["RESEND_API_KEY", "RESEND_FROM"],
  redis: ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"],
  qstash: ["UPSTASH_QSTASH_TOKEN"],
  vapid: ["VAPID_PUBLIC_KEY", "VAPID_PRIVATE_KEY", "VAPID_SUBJECT"],
  sentry: ["SENTRY_DSN"]
};

for (const [name, keys] of Object.entries(optionalGroups)) {
  if (hasAny(keys) && !hasAll(keys)) {
    console.warn(`[env] Partial ${name} configuration detected`);
  }
}

if (env.NODE_ENV === "production") {
  const requiredInProd: Array<keyof typeof env> = ["DATABASE_URL", "APP_URL", "SESSION_SECRET", "SESSION_COOKIE_NAME"];
  const missing = requiredInProd.filter((key) => !env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required production environment variables: ${missing.join(", ")}`);
  }

  if (env.PAYMENT_PROVIDER !== "mock" && !env.PAYMENT_WEBHOOK_SECRET) {
    throw new Error("Missing PAYMENT_WEBHOOK_SECRET for non-mock payment provider");
  }
}
