import { z } from "zod";

export const logMealSchema = z.object({
  idempotencyKey: z.string().min(8),
  childId: z.string().min(1),
  mealAt: z.coerce.date(),
  details: z.record(z.unknown())
});

export type LogMealInput = z.infer<typeof logMealSchema>;
