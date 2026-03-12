import { describe, expect, it } from "vitest";
import { createChildSchema } from "../../src/modules/children/children.schema";
import { markAttendanceSchema } from "../../src/modules/attendance/attendance.schema";

describe("schema validation", () => {
  it("validates child payload", () => {
    const parsed = createChildSchema.safeParse({
      idempotencyKey: "abc12345",
      firstName: "Jane",
      lastName: "Doe"
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects invalid attendance payload", () => {
    const parsed = markAttendanceSchema.safeParse({
      idempotencyKey: "short",
      childId: "child_1",
      date: "bad-date",
      status: "other"
    });
    expect(parsed.success).toBe(false);
  });
});
