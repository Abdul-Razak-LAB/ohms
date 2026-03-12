import { z } from "zod";

export const verifyDocumentSchema = z.object({
  idempotencyKey: z.string().min(8),
  childDocumentId: z.string().min(1)
});

export type VerifyDocumentInput = z.infer<typeof verifyDocumentSchema>;
