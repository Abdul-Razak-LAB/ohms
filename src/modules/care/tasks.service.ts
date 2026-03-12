import { Prisma } from "@prisma/client";
import { prisma } from "@/platform/db/prisma";
import { retrySerializable } from "@/platform/db/tx-retry";
import { requirePermission } from "@/modules/auth/permissions";
import { appendEvent } from "@/modules/events/event.service";
import { RequestContext } from "@/common/types/auth";
import { CompleteCareTaskInput } from "@/modules/care/tasks.schema";

export async function completeCareTask(input: CompleteCareTaskInput, ctx: RequestContext) {
  requirePermission(ctx.homeId, "caretask:write", ctx.user);

  return retrySerializable(() =>
    prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const completedAt = input.completedAt || new Date();
      const task = await tx.careTask.upsert({
        where: {
          homeId_idempotencyKey: {
            homeId: ctx.homeId,
            idempotencyKey: input.idempotencyKey
          }
        },
        create: {
          homeId: ctx.homeId,
          childId: input.childId,
          title: input.title,
          dueAt: input.dueAt,
          completedAt,
          completedBy: ctx.user.id,
          idempotencyKey: input.idempotencyKey
        },
        update: {
          completedAt,
          completedBy: ctx.user.id
        }
      });

      await appendEvent(tx, {
        homeId: ctx.homeId,
        aggregateType: "care_task",
        aggregateId: task.id,
        eventType: "CARE_TASK_COMPLETED",
        payload: {
          childId: input.childId,
          taskId: task.id
        },
        actorUserId: ctx.user.id,
        idempotencyKey: `event_${input.idempotencyKey}`
      }).catch(() => undefined);

      return task;
    }, { isolationLevel: "Serializable" })
  );
}
