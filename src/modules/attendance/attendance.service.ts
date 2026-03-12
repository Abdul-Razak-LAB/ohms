import { Prisma } from "@prisma/client";
import { prisma } from "@/platform/db/prisma";
import { retrySerializable } from "@/platform/db/tx-retry";
import { requirePermission } from "@/modules/auth/permissions";
import { appendEvent } from "@/modules/events/event.service";
import { MarkAttendanceInput } from "@/modules/attendance/attendance.schema";
import { RequestContext } from "@/common/types/auth";

export async function markAttendance(input: MarkAttendanceInput, ctx: RequestContext) {
  requirePermission(ctx.homeId, "attendance:write", ctx.user);

  return retrySerializable(async () => {
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const record = await tx.attendanceLog.upsert({
        where: {
          homeId_idempotencyKey: {
            homeId: ctx.homeId,
            idempotencyKey: input.idempotencyKey
          }
        },
        create: {
          homeId: ctx.homeId,
          childId: input.childId,
          date: input.date,
          status: input.status,
          markedBy: ctx.user.id,
          idempotencyKey: input.idempotencyKey
        },
        update: {}
      });

      await appendEvent(tx, {
        homeId: ctx.homeId,
        aggregateType: "attendance",
        aggregateId: record.id,
        eventType: "ATTENDANCE_MARKED",
        payload: { childId: input.childId, date: input.date, status: input.status },
        actorUserId: ctx.user.id,
        idempotencyKey: `event_${input.idempotencyKey}`
      }).catch(() => undefined);

      return record;
    }, { isolationLevel: "Serializable" });
  });
}
