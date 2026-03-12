import { NextRequest } from "next/server";
import { z } from "zod";
import { withApiHandler, requireJson } from "@/common/api/handler";
import { readHomeId } from "@/common/utils/route";
import { buildRequestContext } from "@/common/types/context";
import { createSignedUpload } from "@/modules/media/media.service";
import { ValidationError } from "@/common/errors/app-error";

const signSchema = z.object({
  folder: z.enum(["documents", "media", "reports"]),
  contentType: z.string().min(1),
  sizeBytes: z.number().int().positive(),
  checksumSha256: z.string().length(64),
  deviceInfo: z.record(z.unknown()).optional(),
  gps: z.record(z.unknown()).optional()
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ homeId: string }> }) {
  return withApiHandler(async () => {
    requireJson(request);

    const { homeId } = await params;
    const scopedHomeId = readHomeId({ homeId });
    await buildRequestContext(request, scopedHomeId);

    const parsed = signSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new ValidationError("VAL_INVALID_PAYLOAD", "Invalid signed upload payload", parsed.error.flatten());
    }

    return createSignedUpload({ homeId: scopedHomeId, ...parsed.data });
  });
}
