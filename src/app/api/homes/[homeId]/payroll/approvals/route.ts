import { NextRequest } from "next/server";
import { z } from "zod";
import { withApiHandler, requireJson } from "@/common/api/handler";
import { readHomeId } from "@/common/utils/route";
import { buildRequestContext } from "@/common/types/context";
import { approvePayrollRun } from "@/modules/finance/payroll/payroll.service";
import { ValidationError } from "@/common/errors/app-error";

const approveSchema = z.object({
  payrollRunId: z.string().min(1),
  decision: z.enum(["approved", "rejected"])
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ homeId: string }> }) {
  return withApiHandler(async () => {
    requireJson(request);

    const { homeId } = await params;
    const context = await buildRequestContext(request, readHomeId({ homeId }));

    const parsed = approveSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new ValidationError("VAL_INVALID_PAYLOAD", "Invalid payroll approval payload", parsed.error.flatten());
    }

    return approvePayrollRun(parsed.data, context);
  });
}
