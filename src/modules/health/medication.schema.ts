import { z } from "zod";

export const administerMedicationSchema = z.object({
  idempotencyKey: z.string().min(8),
  childId: z.string().min(1),
  medicationPlanId: z.string().optional(),
  administeredAt: z.coerce.date()
});

export type AdministerMedicationInput = z.infer<typeof administerMedicationSchema>;
