import { NextRequest } from "next/server";
import { withApiHandler, requireJson } from "@/common/api/handler";
import { readHomeId } from "@/common/utils/route";
import { buildRequestContext } from "@/common/types/context";
import { ValidationError } from "@/common/errors/app-error";
import { administerMedicationSchema } from "@/modules/health/medication.schema";
import { administerMedication } from "@/modules/health/medication.service";

export async function POST(request: NextRequest, { params }: { params: Promise<{ homeId: string }> }) {
  return withApiHandler(async () => {
    requireJson(request);

    const { homeId } = await params;
    const context = await buildRequestContext(request, readHomeId({ homeId }));

    const parsed = administerMedicationSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new ValidationError("VAL_INVALID_PAYLOAD", "Invalid medication payload", parsed.error.flatten());
    }

    const medicationLog = await administerMedication(parsed.data, context);
    return { medicationLog };
  });
}
