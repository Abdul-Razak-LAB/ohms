import { Prisma } from "@prisma/client";
import { prisma } from "@/platform/db/prisma";
import { retrySerializable } from "@/platform/db/tx-retry";
import { requirePermission } from "@/modules/auth/permissions";
import { appendEvent } from "@/modules/events/event.service";
import { RequestContext } from "@/common/types/auth";
import { LogMealInput } from "@/modules/nutrition/meals.schema";

export async function logMeal(input: LogMealInput, ctx: RequestContext) {
  requirePermission(ctx.homeId, "meal:write", ctx.user);

  return retrySerializable(() =>
    prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const meal = await tx.mealLog.upsert({
        where: {
          homeId_idempotencyKey: {
            homeId: ctx.homeId,
            idempotencyKey: input.idempotencyKey
          }
        },
        create: {
          homeId: ctx.homeId,
          childId: input.childId,
          mealAt: input.mealAt,
          details: input.details as never,
          idempotencyKey: input.idempotencyKey
        },
        update: {}
      });

      await appendEvent(tx, {
        homeId: ctx.homeId,
        aggregateType: "meal_log",
        aggregateId: meal.id,
        eventType: "MEAL_LOGGED",
        payload: {
          childId: input.childId,
          mealAt: input.mealAt.toISOString()
        },
        actorUserId: ctx.user.id,
        idempotencyKey: `event_${input.idempotencyKey}`
      }).catch(() => undefined);

      return meal;
    }, { isolationLevel: "Serializable" })
  );
}
