import { NextRequest } from "next/server";
import { withApiHandler, requireJson } from "@/common/api/handler";
import { readHomeId } from "@/common/utils/route";
import { buildRequestContext } from "@/common/types/context";
import { createChildSchema } from "@/modules/children/children.schema";
import { createChild } from "@/modules/children/children.service";
import { requireSameOrigin } from "@/platform/security/same-origin";
import { enforceRateLimit } from "@/platform/cache/rate-limit";
import { ValidationError } from "@/common/errors/app-error";

export async function POST(request: NextRequest, { params }: { params: Promise<{ homeId: string }> }) {
  return withApiHandler(async () => {
    requireJson(request);
    requireSameOrigin(request);

    const { homeId } = await params;
    const scopedHomeId = readHomeId({ homeId });
    const context = await buildRequestContext(request, scopedHomeId);
    await enforceRateLimit(`children:${context.homeId}:${context.user.id}`, 50, 60);

    const json = await request.json();
    const parsed = createChildSchema.safeParse(json);
    if (!parsed.success) {
      throw new ValidationError("VAL_INVALID_PAYLOAD", "Invalid child create payload", parsed.error.flatten());
    }

    const child = await createChild(parsed.data, context);
    return { child };
  });
}
