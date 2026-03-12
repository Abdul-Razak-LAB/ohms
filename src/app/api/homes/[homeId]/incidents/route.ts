import { NextRequest } from "next/server";
import { z } from "zod";
import { withApiHandler, requireJson } from "@/common/api/handler";
import { readHomeId } from "@/common/utils/route";
import { buildRequestContext } from "@/common/types/context";
import { reportIncident } from "@/modules/safeguarding/incidents.service";
import { ValidationError } from "@/common/errors/app-error";

const reportIncidentSchema = z.object({
  idempotencyKey: z.string().min(8),
  childId: z.string().optional(),
  category: z.string().min(2),
  severity: z.enum(["low", "medium", "high", "critical"])
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ homeId: string }> }) {
  return withApiHandler(async () => {
    requireJson(request);

    const { homeId } = await params;
    const context = await buildRequestContext(request, readHomeId({ homeId }));

    const parsed = reportIncidentSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new ValidationError("VAL_INVALID_PAYLOAD", "Invalid incident payload", parsed.error.flatten());
    }

    const incident = await reportIncident(parsed.data, context);
    return { incident };
  });
}
