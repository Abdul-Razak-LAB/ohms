import { Prisma } from "@prisma/client";

function isRetryable(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const maybeCode = (error as { code?: string }).code;
    return maybeCode === "P2034";
  }
  return false;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function retrySerializable<T>(fn: () => Promise<T>, attempts = 4): Promise<T> {
  let current = 0;
  while (current < attempts) {
    try {
      return await fn();
    } catch (error) {
      if (!isRetryable(error) || current === attempts - 1) {
        throw error;
      }
      await sleep(50 * Math.pow(2, current));
      current++;
    }
  }

  throw new Error("retry exhausted");
}
