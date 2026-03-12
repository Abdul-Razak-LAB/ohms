import { z } from "zod";

export const createChildSchema = z.object({
  idempotencyKey: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dob: z.coerce.date().optional(),
  profile: z
    .object({
      bloodGroup: z.string().optional(),
      allergies: z.array(z.string()).optional(),
      specialNeeds: z.array(z.string()).optional()
    })
    .optional()
});

export type CreateChildInput = z.infer<typeof createChildSchema>;
