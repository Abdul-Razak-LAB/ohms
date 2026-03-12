import { z } from "zod";

export const createPurchaseOrderSchema = z.object({
  idempotencyKey: z.string().min(8),
  requestId: z.string().optional(),
  vendorId: z.string().min(1),
  items: z.array(
    z.object({
      sku: z.string().optional(),
      description: z.string().min(2),
      qty: z.number().int().positive(),
      unitPriceCents: z.number().int().positive()
    })
  ).min(1)
});

export const recordDeliverySchema = z.object({
  idempotencyKey: z.string().min(8),
  purchaseOrderId: z.string().min(1),
  receivedAt: z.coerce.date(),
  variance: z.record(z.unknown()).optional()
});

export type CreatePurchaseOrderInput = z.infer<typeof createPurchaseOrderSchema>;
export type RecordDeliveryInput = z.infer<typeof recordDeliverySchema>;
