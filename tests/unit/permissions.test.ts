import { describe, expect, it } from "vitest";
import { requirePermission } from "../../src/modules/auth/permissions";

describe("permissions", () => {
  it("allows administrator wildcard", () => {
    expect(() =>
      requirePermission("home_1", "payroll:approve", {
        id: "u1",
        email: "admin@ohms.local",
        rolesByHome: { home_1: ["administrator"] }
      })
    ).not.toThrow();
  });

  it("denies unauthorized role", () => {
    expect(() =>
      requirePermission("home_1", "payroll:approve", {
        id: "u2",
        email: "cg@ohms.local",
        rolesByHome: { home_1: ["caregiver"] }
      })
    ).toThrow();
  });
});
