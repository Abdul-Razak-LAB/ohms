import { NextRequest } from "next/server";
import { withApiHandler, requireJson } from "@/common/api/handler";
import { readHomeId } from "@/common/utils/route";
import { buildRequestContext } from "@/common/types/context";
import { ValidationError } from "@/common/errors/app-error";
import { recordDeliverySchema } from "@/modules/procurement/procurement.schema";
import { recordDelivery } from "@/modules/procurement/procurement.service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ homeId: string; poId: string }> }
) {
  return withApiHandler(async () => {
    requireJson(request);

    const { homeId, poId } = await params;
    const context = await buildRequestContext(request, readHomeId({ homeId }));

    const body = await request.json();
    const parsed = recordDeliverySchema.safeParse({ ...body, purchaseOrderId: poId });
    if (!parsed.success) {
      throw new ValidationError("VAL_INVALID_PAYLOAD", "Invalid delivery receipt payload", parsed.error.flatten());
    }

    const deliveryReceipt = await recordDelivery(parsed.data, context);
    return { deliveryReceipt };
  });
}
