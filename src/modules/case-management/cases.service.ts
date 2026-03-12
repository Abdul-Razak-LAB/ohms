import { Prisma } from "@prisma/client";
import { prisma } from "@/platform/db/prisma";
import { retrySerializable } from "@/platform/db/tx-retry";
import { requirePermission } from "@/modules/auth/permissions";
import { appendEvent } from "@/modules/events/event.service";
import { RequestContext } from "@/common/types/auth";

type UpdateCasePlanInput = {
  idempotencyKey: string;
  caseId: string;
  goals: unknown;
  interventions: unknown;
};

export async function updateCasePlan(input: UpdateCasePlanInput, ctx: RequestContext) {
  requirePermission(ctx.homeId, "case:manage", ctx.user);

  return retrySerializable(() =>
    prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const caseRecord = await tx.case.findUnique({ where: { id: input.caseId } });
      if (!caseRecord || caseRecord.homeId !== ctx.homeId) {
        throw new Error("BIZ_CASE_NOT_FOUND");
      }

      const plan = await tx.casePlan.create({
        data: {
          caseId: input.caseId,
          goals: input.goals as never,
          interventions: input.interventions as never,
          updatedBy: ctx.user.id
        }
      });

      await appendEvent(tx, {
        homeId: ctx.homeId,
        aggregateType: "case",
        aggregateId: input.caseId,
        eventType: "CASE_PLAN_UPDATED",
        payload: { planId: plan.id },
        actorUserId: ctx.user.id,
        idempotencyKey: input.idempotencyKey
      });

      return plan;
    }, { isolationLevel: "Serializable" })
  );
}
