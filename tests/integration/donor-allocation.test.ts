import { beforeEach, describe, expect, it, vi } from "vitest";

const requirePermissionMock = vi.fn();
const appendEventMock = vi.fn();

const prismaMock = {
  $transaction: vi.fn(),
  donation: { findUnique: vi.fn() },
  donorAllocation: { aggregate: vi.fn(), upsert: vi.fn() }
};

vi.mock("@/platform/db/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/platform/db/tx-retry", () => ({ retrySerializable: (fn: () => Promise<unknown>) => fn() }));
vi.mock("@/modules/auth/permissions", () => ({ requirePermission: requirePermissionMock }));
vi.mock("@/modules/events/event.service", () => ({ appendEvent: appendEventMock }));

describe("donor allocation invariants", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.$transaction.mockImplementation((fn: (tx: typeof prismaMock) => Promise<unknown>) => fn(prismaMock));
  });

  it("rejects allocations that exceed donation amount", async () => {
    prismaMock.donation.findUnique.mockResolvedValue({ id: "d1", homeId: "h1", amountCents: 1000 });
    prismaMock.donorAllocation.aggregate.mockResolvedValue({ _sum: { allocatedCents: 900 } });

    const { allocateDonation } = await import("@/modules/finance/donor-funds/donor-funds.service");

    await expect(
      allocateDonation(
        {
          idempotencyKey: "abc12345",
          donationId: "d1",
          targetType: "expense",
          targetId: "e1",
          allocatedCents: 200
        },
        {
          requestId: "r1",
          homeId: "h1",
          ip: "127.0.0.1",
          user: { id: "u1", email: "u1@example.com", rolesByHome: { h1: ["finance"] } }
        }
      )
    ).rejects.toMatchObject({ code: "FINANCE_DONOR_ALLOCATION_EXCEEDS_DONATION" });
  });
});
