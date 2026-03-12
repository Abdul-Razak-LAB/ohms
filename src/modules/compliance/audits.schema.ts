import { z } from "zod";

export const completeAuditSchema = z.object({
  idempotencyKey: z.string().min(8),
  auditId: z.string().min(1),
  score: z.number().min(0).max(100),
  findings: z.record(z.unknown())
});

export type CompleteAuditInput = z.infer<typeof completeAuditSchema>;
