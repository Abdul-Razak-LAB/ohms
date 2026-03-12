import { Prisma } from "@prisma/client";
import { prisma } from "@/platform/db/prisma";
import { retrySerializable } from "@/platform/db/tx-retry";
import { requirePermission } from "@/modules/auth/permissions";
import { appendEvent } from "@/modules/events/event.service";
import { ConflictError } from "@/common/errors/app-error";
import { CreateChildInput } from "@/modules/children/children.schema";
import { RequestContext } from "@/common/types/auth";

export async function createChild(input: CreateChildInput, ctx: RequestContext) {
  requirePermission(ctx.homeId, "child:create", ctx.user);

  return retrySerializable(async () => {
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const existing = await tx.event.findUnique({
        where: {
          homeId_idempotencyKey: {
            homeId: ctx.homeId,
            idempotencyKey: input.idempotencyKey
          }
        }
      });

      if (existing) {
        const child = await tx.child.findFirst({
          where: {
            homeId: ctx.homeId,
            id: existing.aggregateId
          }
        });
        if (!child) {
          throw new ConflictError("IDEMPOTENCY_DUPLICATE_KEY", "Idempotent event already consumed");
        }
        return child;
      }

      const child = await tx.child.create({
        data: {
          homeId: ctx.homeId,
          firstName: input.firstName,
          lastName: input.lastName,
          dob: input.dob,
          profile: input.profile
            ? {
                create: {
                  bloodGroup: input.profile.bloodGroup,
                  allergies: input.profile.allergies,
                  specialNeeds: input.profile.specialNeeds
                }
              }
            : undefined
        }
      });

      await appendEvent(tx, {
        homeId: ctx.homeId,
        aggregateType: "child",
        aggregateId: child.id,
        eventType: "CHILD_REGISTERED",
        payload: {
          childId: child.id,
          firstName: child.firstName,
          lastName: child.lastName
        },
        actorUserId: ctx.user.id,
        idempotencyKey: input.idempotencyKey
      });

      return child;
    }, { isolationLevel: "Serializable" });
  });
}
