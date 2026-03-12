import { Prisma } from "@prisma/client";
import { prisma } from "@/platform/db/prisma";
import { retrySerializable } from "@/platform/db/tx-retry";
import { requirePermission } from "@/modules/auth/permissions";
import { appendEvent } from "@/modules/events/event.service";
import { RequestContext } from "@/common/types/auth";
import { AdministerMedicationInput } from "@/modules/health/medication.schema";

export async function administerMedication(input: AdministerMedicationInput, ctx: RequestContext) {
  requirePermission(ctx.homeId, "medication:write", ctx.user);

  return retrySerializable(() =>
    prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const log = await tx.medicationLog.upsert({
        where: {
          homeId_idempotencyKey: {
            homeId: ctx.homeId,
            idempotencyKey: input.idempotencyKey
          }
        },
        create: {
          homeId: ctx.homeId,
          childId: input.childId,
          medicationPlanId: input.medicationPlanId,
          administeredAt: input.administeredAt,
          administeredBy: ctx.user.id,
          idempotencyKey: input.idempotencyKey
        },
        update: {}
      });

      await appendEvent(tx, {
        homeId: ctx.homeId,
        aggregateType: "medication_log",
        aggregateId: log.id,
        eventType: "MEDICATION_ADMINISTERED",
        payload: {
          childId: input.childId,
          administeredAt: input.administeredAt.toISOString()
        },
        actorUserId: ctx.user.id,
        idempotencyKey: `event_${input.idempotencyKey}`
      }).catch(() => undefined);

      return log;
    }, { isolationLevel: "Serializable" })
  );
}
