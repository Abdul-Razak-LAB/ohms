import { NextRequest } from "next/server";
import { z } from "zod";
import { withApiHandler, requireJson } from "@/common/api/handler";
import { readHomeId } from "@/common/utils/route";
import { buildRequestContext } from "@/common/types/context";
import { allocateDonation } from "@/modules/finance/donor-funds/donor-funds.service";
import { ValidationError } from "@/common/errors/app-error";

const allocationSchema = z.object({
  idempotencyKey: z.string().min(8),
  donationId: z.string().min(1),
  targetType: z.string().min(1),
  targetId: z.string().min(1),
  allocatedCents: z.number().int().positive()
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ homeId: string }> }) {
  return withApiHandler(async () => {
    requireJson(request);

    const { homeId } = await params;
    const context = await buildRequestContext(request, readHomeId({ homeId }));

    const parsed = allocationSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new ValidationError("VAL_INVALID_PAYLOAD", "Invalid allocation payload", parsed.error.flatten());
    }

    const allocation = await allocateDonation(parsed.data, context);
    return { allocation };
  });
}
