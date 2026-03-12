import { prisma } from "@/platform/db/prisma";
import { Event } from "@prisma/client";
import { AppError } from "@/common/errors/app-error";
import { RequestContext } from "@/common/types/auth";

const MAX_BATCH_SIZE = 500;

type OutboxItem = {
  clientEventId: string;
  entityType: string;
  payload: Record<string, unknown>;
};

export async function getSyncData(homeId: string, cursor: string | null, limit = 200) {
  const cursorDate = cursor ? new Date(cursor) : new Date(0);

  const events = await prisma.event.findMany({
    where: {
      homeId,
      createdAt: { gt: cursorDate }
    },
    orderBy: { createdAt: "asc" },
    take: Math.min(limit, 500)
  });

  const nextCursor = events.length > 0 ? events[events.length - 1].createdAt.toISOString() : cursor;

  return {
    items: events.map((event: Event) => ({
      id: event.id,
      aggregateType: event.aggregateType,
      aggregateId: event.aggregateId,
      eventType: event.eventType,
      payload: event.payload,
      deleted: false,
      createdAt: event.createdAt
    })),
    nextCursor
  };
}

export async function ingestSyncBatch(
  ctx: RequestContext,
  deviceId: string,
  items: OutboxItem[]
) {
  if (items.length > MAX_BATCH_SIZE) {
    throw new AppError("SYNC_BATCH_TOO_LARGE", `Maximum batch size is ${MAX_BATCH_SIZE}`, 422);
  }

  const results: Array<{ clientEventId: string; success: boolean; code: string }> = [];

  for (const item of items) {
    try {
      const existing = await prisma.outboxReceipt.findUnique({
        where: {
          homeId_deviceId_clientEventId: {
            homeId: ctx.homeId,
            deviceId,
            clientEventId: item.clientEventId
          }
        }
      });

      if (existing) {
        results.push({ clientEventId: item.clientEventId, success: true, code: "DUPLICATE_IGNORED" });
        continue;
      }

      await prisma.outboxReceipt.create({
        data: {
          homeId: ctx.homeId,
          deviceId,
          clientEventId: item.clientEventId,
          entityType: item.entityType,
          resultCode: "OK"
        }
      });

      results.push({ clientEventId: item.clientEventId, success: true, code: "OK" });
    } catch {
      results.push({ clientEventId: item.clientEventId, success: false, code: "SYNC_TRANSIENT_DEPENDENCY" });
    }
  }

  return { results };
}
