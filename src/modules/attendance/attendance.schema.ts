import { z } from "zod";

export const markAttendanceSchema = z.object({
  idempotencyKey: z.string().min(8),
  childId: z.string().min(1),
  date: z.coerce.date(),
  status: z.enum(["present", "absent", "excused"])
});

export type MarkAttendanceInput = z.infer<typeof markAttendanceSchema>;
