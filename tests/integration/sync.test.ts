import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = {
  outboxReceipt: {
    findUnique: vi.fn(),
    create: vi.fn()
  },
  event: {
    findMany: vi.fn()
  }
};

vi.mock("@/platform/db/prisma", () => ({ prisma: prismaMock }));

describe("sync ingestion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns per-item results and does not fail full batch", async () => {
    prismaMock.outboxReceipt.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
    prismaMock.outboxReceipt.create.mockResolvedValueOnce({ id: "ok" }).mockRejectedValueOnce(new Error("db transient"));

    const { ingestSyncBatch } = await import("@/modules/sync/sync.service");

    const result = await ingestSyncBatch(
      {
        requestId: "r1",
        homeId: "h1",
        ip: "127.0.0.1",
        user: { id: "u1", email: "u1@example.com", rolesByHome: { h1: ["caregiver"] } }
      },
      "device-1",
      [
        { clientEventId: "ev1", entityType: "attendance", payload: {} },
        { clientEventId: "ev2", entityType: "attendance", payload: {} }
      ]
    );

    expect(result.results).toHaveLength(2);
    expect(result.results[0]).toMatchObject({ clientEventId: "ev1", success: true, code: "OK" });
    expect(result.results[1]).toMatchObject({ clientEventId: "ev2", success: false, code: "SYNC_TRANSIENT_DEPENDENCY" });
  });
});
