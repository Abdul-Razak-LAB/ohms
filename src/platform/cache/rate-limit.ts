import { Redis } from "@upstash/redis";
import { RetryableError } from "@/common/errors/app-error";

const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN
    })
  : null;

export async function enforceRateLimit(key: string, limit: number, windowSeconds: number) {
  if (!redis) return;

  const nowWindow = Math.floor(Date.now() / 1000 / windowSeconds);
  const redisKey = `rl:${key}:${nowWindow}`;
  const count = await redis.incr(redisKey);
  if (count === 1) {
    await redis.expire(redisKey, windowSeconds);
  }
  if (count > limit) {
    throw new RetryableError("RATE_LIMITED", "Rate limit exceeded");
  }
}
