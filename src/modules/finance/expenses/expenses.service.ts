import { Prisma } from "@prisma/client";
import { prisma } from "@/platform/db/prisma";
import { retrySerializable } from "@/platform/db/tx-retry";
import { requirePermission } from "@/modules/auth/permissions";
import { appendEvent } from "@/modules/events/event.service";
import { CreateExpenseRequestInput } from "@/modules/finance/expenses/expenses.schema";
import { RequestContext } from "@/common/types/auth";

export async function createExpenseRequest(input: CreateExpenseRequestInput, ctx: RequestContext) {
  requirePermission(ctx.homeId, "expense:create", ctx.user);

  return retrySerializable(() =>
    prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const created = await tx.expenseRequest.upsert({
        where: {
          homeId_idempotencyKey: {
            homeId: ctx.homeId,
            idempotencyKey: input.idempotencyKey
          }
        },
        create: {
          homeId: ctx.homeId,
          budgetLineId: input.budgetLineId,
          amountCents: input.amountCents,
          currency: input.currency,
          purpose: input.purpose,
          status: "requested",
          requestedBy: ctx.user.id,
          idempotencyKey: input.idempotencyKey
        },
        update: {}
      });

      await appendEvent(tx, {
        homeId: ctx.homeId,
        aggregateType: "expense_request",
        aggregateId: created.id,
        eventType: "EXPENSE_REQUESTED",
        payload: { amountCents: input.amountCents, currency: input.currency },
        actorUserId: ctx.user.id,
        idempotencyKey: `event_${input.idempotencyKey}`
      }).catch(() => undefined);

      return created;
    }, { isolationLevel: "Serializable" })
  );
}
