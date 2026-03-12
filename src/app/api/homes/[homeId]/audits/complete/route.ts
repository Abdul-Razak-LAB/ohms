import { NextRequest } from "next/server";
import { withApiHandler, requireJson } from "@/common/api/handler";
import { readHomeId } from "@/common/utils/route";
import { buildRequestContext } from "@/common/types/context";
import { ValidationError } from "@/common/errors/app-error";
import { completeAuditSchema } from "@/modules/compliance/audits.schema";
import { completeAudit } from "@/modules/compliance/audits.service";

export async function POST(request: NextRequest, { params }: { params: Promise<{ homeId: string }> }) {
  return withApiHandler(async () => {
    requireJson(request);

    const { homeId } = await params;
    const context = await buildRequestContext(request, readHomeId({ homeId }));

    const parsed = completeAuditSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new ValidationError("VAL_INVALID_PAYLOAD", "Invalid audit completion payload", parsed.error.flatten());
    }

    const result = await completeAudit(parsed.data, context);
    return { result };
  });
}
