import { Prisma } from "@prisma/client";
import { prisma } from "@/platform/db/prisma";
import { retrySerializable } from "@/platform/db/tx-retry";
import { AppError } from "@/common/errors/app-error";
import { RequestContext } from "@/common/types/auth";
import { requirePermission } from "@/modules/auth/permissions";
import { appendEvent } from "@/modules/events/event.service";

type AllocationInput = {
  idempotencyKey: string;
  donationId: string;
  targetType: string;
  targetId: string;
  allocatedCents: number;
};

export async function allocateDonation(input: AllocationInput, ctx: RequestContext) {
  requirePermission(ctx.homeId, "donor:manage", ctx.user);

  return retrySerializable(() =>
    prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const donation = await tx.donation.findUnique({ where: { id: input.donationId } });
      if (!donation || donation.homeId !== ctx.homeId) {
        throw new AppError("FINANCE_DONATION_NOT_FOUND", "Donation not found", 404);
      }

      const aggregate = await tx.donorAllocation.aggregate({
        where: { homeId: ctx.homeId, donationId: input.donationId },
        _sum: { allocatedCents: true }
      });

      const already = aggregate._sum.allocatedCents || 0;
      const newTotal = already + input.allocatedCents;
      if (newTotal > donation.amountCents) {
        throw new AppError("FINANCE_DONOR_ALLOCATION_EXCEEDS_DONATION", "Allocation exceeds donation amount", 422);
      }

      const allocation = await tx.donorAllocation.upsert({
        where: {
          homeId_idempotencyKey: {
            homeId: ctx.homeId,
            idempotencyKey: input.idempotencyKey
          }
        },
        create: {
          homeId: ctx.homeId,
          donationId: input.donationId,
          targetType: input.targetType,
          targetId: input.targetId,
          allocatedCents: input.allocatedCents,
          idempotencyKey: input.idempotencyKey
        },
        update: {}
      });

      await appendEvent(tx, {
        homeId: ctx.homeId,
        aggregateType: "donor_allocation",
        aggregateId: allocation.id,
        eventType: "DONOR_ALLOCATION_APPLIED",
        payload: { donationId: input.donationId, allocatedCents: input.allocatedCents },
        actorUserId: ctx.user.id,
        idempotencyKey: `event_${input.idempotencyKey}`
      }).catch(() => undefined);

      return allocation;
    }, { isolationLevel: "Serializable" })
  );
}
