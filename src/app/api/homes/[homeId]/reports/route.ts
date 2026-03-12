import { NextRequest } from "next/server";
import { z } from "zod";
import { withApiHandler, requireJson } from "@/common/api/handler";
import { readHomeId } from "@/common/utils/route";
import { buildRequestContext } from "@/common/types/context";
import { generateTransparencyReport } from "@/modules/reporting/reports.service";
import { ValidationError } from "@/common/errors/app-error";

const reportSchema = z.object({
  kind: z.string().min(1),
  periodStart: z.coerce.date(),
  periodEnd: z.coerce.date()
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ homeId: string }> }) {
  return withApiHandler(async () => {
    requireJson(request);

    const { homeId } = await params;
    const context = await buildRequestContext(request, readHomeId({ homeId }));

    const parsed = reportSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new ValidationError("VAL_INVALID_PAYLOAD", "Invalid report payload", parsed.error.flatten());
    }

    const report = await generateTransparencyReport(
      context,
      parsed.data.kind,
      parsed.data.periodStart,
      parsed.data.periodEnd
    );

    return { report };
  });
}
