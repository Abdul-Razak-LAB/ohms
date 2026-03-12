import { prisma } from "@/platform/db/prisma";
import { RequestContext } from "@/common/types/auth";
import { requirePermission } from "@/modules/auth/permissions";

export async function enqueueNotification(
  ctx: RequestContext,
  channel: "email" | "push" | "sms",
  template: string,
  payload: Record<string, unknown>,
  scheduledAt?: Date
) {
  requirePermission(ctx.homeId, "notification:send", ctx.user);

  return prisma.$transaction(async (tx) => {
    const notification = await tx.notification.create({
      data: {
        homeId: ctx.homeId,
        channel,
        template,
        payload: payload as never,
        scheduledAt,
        status: "queued"
      }
    });

    await tx.notificationDelivery.create({
      data: {
        notificationId: notification.id,
        status: "queued",
        attempts: 0
      }
    });

    return notification;
  });
}
