import { beforeEach, describe, expect, it, vi } from "vitest";
import { seedFixtures } from "../fixtures/seed-fixtures";

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

describe("offline to online sync e2e scenario", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("syncs offline outbox items and then pulls them online without duplicates", async () => {
    const homeId = seedFixtures.home.id;
    const deviceId = seedFixtures.sync.deviceId;
    const [firstItem, secondItem] = seedFixtures.sync.outboxItems;

    prismaMock.outboxReceipt.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "existing" });

    prismaMock.outboxReceipt.create
      .mockResolvedValueOnce({ id: "receipt_1" })
      .mockResolvedValueOnce({ id: "receipt_2" });

    const eventOneTime = new Date("2026-03-10T10:00:00.000Z");
    const eventTwoTime = new Date("2026-03-10T10:05:00.000Z");

    prismaMock.event.findMany
      .mockResolvedValueOnce([
        {
          id: "ev_1",
          homeId,
          aggregateType: firstItem.entityType,
          aggregateId: "agg_1",
          eventType: "ATTENDANCE_MARKED",
          payload: firstItem.payload,
          createdAt: eventOneTime
        },
        {
          id: "ev_2",
          homeId,
          aggregateType: secondItem.entityType,
          aggregateId: "agg_2",
          eventType: "MEAL_LOGGED",
          payload: secondItem.payload,
          createdAt: eventTwoTime
        }
      ])
      .mockResolvedValueOnce([]);

    const { ingestSyncBatch, getSyncData } = await import("@/modules/sync/sync.service");

    const firstPush = await ingestSyncBatch(
      {
        requestId: "req_1",
        homeId,
        ip: "127.0.0.1",
        user: { id: seedFixtures.users.caregiver.id, email: seedFixtures.users.caregiver.email, rolesByHome: { [homeId]: ["caregiver"] } }
      },
      deviceId,
      [firstItem, secondItem]
    );

    expect(firstPush.results).toEqual([
      { clientEventId: firstItem.clientEventId, success: true, code: "OK" },
      { clientEventId: secondItem.clientEventId, success: true, code: "OK" }
    ]);

    const secondPushDuplicate = await ingestSyncBatch(
      {
        requestId: "req_2",
        homeId,
        ip: "127.0.0.1",
        user: { id: seedFixtures.users.caregiver.id, email: seedFixtures.users.caregiver.email, rolesByHome: { [homeId]: ["caregiver"] } }
      },
      deviceId,
      [firstItem]
    );

    expect(secondPushDuplicate.results).toEqual([
      { clientEventId: firstItem.clientEventId, success: true, code: "DUPLICATE_IGNORED" }
    ]);

    const pull1 = await getSyncData(homeId, null, 200);
    expect(pull1.items).toHaveLength(2);
    expect(pull1.nextCursor).toBe(eventTwoTime.toISOString());

    const pull2 = await getSyncData(homeId, pull1.nextCursor, 200);
    expect(pull2.items).toHaveLength(0);
    expect(pull2.nextCursor).toBe(pull1.nextCursor);
  });
});
