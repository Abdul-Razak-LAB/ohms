import { Prisma } from "@prisma/client";
import { prisma } from "@/platform/db/prisma";
import { retrySerializable } from "@/platform/db/tx-retry";
import { requirePermission } from "@/modules/auth/permissions";
import { appendEvent } from "@/modules/events/event.service";
import { RequestContext } from "@/common/types/auth";
import { AppError } from "@/common/errors/app-error";
import { CreatePurchaseOrderInput, RecordDeliveryInput } from "@/modules/procurement/procurement.schema";

export async function createPurchaseOrder(input: CreatePurchaseOrderInput, ctx: RequestContext) {
  requirePermission(ctx.homeId, "purchase:manage", ctx.user);

  return retrySerializable(() =>
    prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const vendor = await tx.vendor.findUnique({ where: { id: input.vendorId } });
      if (!vendor || vendor.homeId !== ctx.homeId) {
        throw new AppError("PROCUREMENT_VENDOR_NOT_FOUND", "Vendor not found", 404);
      }

      const po = await tx.purchaseOrder.upsert({
        where: {
          homeId_idempotencyKey: {
            homeId: ctx.homeId,
            idempotencyKey: input.idempotencyKey
          }
        },
        create: {
          homeId: ctx.homeId,
          requestId: input.requestId,
          vendorId: vendor.id,
          status: "created",
          idempotencyKey: input.idempotencyKey
        },
        update: {}
      });

      await tx.poItem.createMany({
        data: input.items.map((item) => ({
          purchaseOrderId: po.id,
          sku: item.sku,
          description: item.description,
          qty: item.qty,
          unitPriceCents: item.unitPriceCents
        })),
        skipDuplicates: false
      });

      await appendEvent(tx, {
        homeId: ctx.homeId,
        aggregateType: "purchase_order",
        aggregateId: po.id,
        eventType: "PO_CREATED",
        payload: { vendorId: po.vendorId, itemCount: input.items.length },
        actorUserId: ctx.user.id,
        idempotencyKey: `event_${input.idempotencyKey}`
      }).catch(() => undefined);

      return po;
    }, { isolationLevel: "Serializable" })
  );
}

export async function recordDelivery(input: RecordDeliveryInput, ctx: RequestContext) {
  requirePermission(ctx.homeId, "purchase:manage", ctx.user);

  return retrySerializable(() =>
    prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const po = await tx.purchaseOrder.findUnique({ where: { id: input.purchaseOrderId } });
      if (!po || po.homeId !== ctx.homeId) {
        throw new AppError("PROCUREMENT_PO_NOT_FOUND", "Purchase order not found", 404);
      }

      const receipt = await tx.deliveryReceipt.upsert({
        where: {
          homeId_idempotencyKey: {
            homeId: ctx.homeId,
            idempotencyKey: input.idempotencyKey
          }
        },
        create: {
          homeId: ctx.homeId,
          purchaseOrderId: input.purchaseOrderId,
          receivedAt: input.receivedAt,
          receivedBy: ctx.user.id,
          variance: (input.variance || {}) as never,
          idempotencyKey: input.idempotencyKey
        },
        update: {}
      });

      await tx.purchaseOrder.update({
        where: { id: input.purchaseOrderId },
        data: { status: "delivered" }
      });

      await appendEvent(tx, {
        homeId: ctx.homeId,
        aggregateType: "purchase_order",
        aggregateId: input.purchaseOrderId,
        eventType: "PO_DELIVERED",
        payload: { receiptId: receipt.id },
        actorUserId: ctx.user.id,
        idempotencyKey: `event_${input.idempotencyKey}`
      }).catch(() => undefined);

      return receipt;
    }, { isolationLevel: "Serializable" })
  );
}
