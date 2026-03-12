import { NextRequest } from "next/server";
import { z } from "zod";
import { withApiHandler, requireJson } from "@/common/api/handler";
import { readHomeId } from "@/common/utils/route";
import { buildRequestContext } from "@/common/types/context";
import { getSyncData, ingestSyncBatch } from "@/modules/sync/sync.service";
import { ValidationError } from "@/common/errors/app-error";

const syncPostSchema = z.object({
  deviceId: z.string().min(1),
  items: z.array(
    z.object({
      clientEventId: z.string().min(1),
      entityType: z.string().min(1),
      payload: z.record(z.unknown())
    })
  )
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ homeId: string }> }) {
  return withApiHandler(async () => {
    const { homeId } = await params;
    const scopedHomeId = readHomeId({ homeId });
    await buildRequestContext(request, scopedHomeId);

    const cursor = request.nextUrl.searchParams.get("cursor");
    const limitRaw = request.nextUrl.searchParams.get("limit");
    const limit = limitRaw ? Number(limitRaw) : 200;

    return getSyncData(scopedHomeId, cursor, limit);
  });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ homeId: string }> }) {
  return withApiHandler(async () => {
    requireJson(request);

    const { homeId } = await params;
    const context = await buildRequestContext(request, readHomeId({ homeId }));

    const parsed = syncPostSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new ValidationError("VAL_INVALID_PAYLOAD", "Invalid sync payload", parsed.error.flatten());
    }

    return ingestSyncBatch(context, parsed.data.deviceId, parsed.data.items);
  });
}
