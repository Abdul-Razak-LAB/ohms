import { NextRequest } from "next/server";
import { z } from "zod";
import { withApiHandler, requireJson } from "@/common/api/handler";
import { readHomeId } from "@/common/utils/route";
import { buildRequestContext } from "@/common/types/context";
import { updateCasePlan } from "@/modules/case-management/cases.service";
import { ValidationError } from "@/common/errors/app-error";

const updateSchema = z.object({
  idempotencyKey: z.string().min(8),
  caseId: z.string().min(1),
  goals: z.unknown(),
  interventions: z.unknown()
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ homeId: string }> }) {
  return withApiHandler(async () => {
    requireJson(request);

    const { homeId } = await params;
    const context = await buildRequestContext(request, readHomeId({ homeId }));

    const parsed = updateSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new ValidationError("VAL_INVALID_PAYLOAD", "Invalid case plan payload", parsed.error.flatten());
    }

    const casePlan = await updateCasePlan(parsed.data, context);
    return { casePlan };
  });
}
