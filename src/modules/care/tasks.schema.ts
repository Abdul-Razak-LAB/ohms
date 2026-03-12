import { z } from "zod";

export const completeCareTaskSchema = z.object({
  idempotencyKey: z.string().min(8),
  childId: z.string().min(1),
  title: z.string().min(2),
  dueAt: z.coerce.date(),
  completedAt: z.coerce.date().optional()
});

export type CompleteCareTaskInput = z.infer<typeof completeCareTaskSchema>;
