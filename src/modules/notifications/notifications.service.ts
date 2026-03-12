import { prisma } from "@/platform/db/prisma";
import { RequestContext } from "@/common/types/auth";

export async function enqueueNotification(
  ctx: RequestContext,
  channel: "email" | "push" | "sms",
  template: string,
  payload: Record<string, unknown>,
  scheduledAt?: Date
) {
  return prisma.notification.create({
    data: {
      homeId: ctx.homeId,
      channel,
      template,
      payload: payload as never,
      scheduledAt,
      status: "queued"
    }
  });
}
