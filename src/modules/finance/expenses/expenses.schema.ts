import { z } from "zod";

export const createExpenseRequestSchema = z.object({
  idempotencyKey: z.string().min(8),
  budgetLineId: z.string().optional(),
  amountCents: z.number().int().positive(),
  currency: z.string().length(3),
  purpose: z.string().min(3)
});

export type CreateExpenseRequestInput = z.infer<typeof createExpenseRequestSchema>;
