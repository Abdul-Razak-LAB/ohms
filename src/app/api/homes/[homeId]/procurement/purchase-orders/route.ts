import { NextRequest } from "next/server";
import { withApiHandler, requireJson } from "@/common/api/handler";
import { readHomeId } from "@/common/utils/route";
import { buildRequestContext } from "@/common/types/context";
import { ValidationError } from "@/common/errors/app-error";
import { createPurchaseOrderSchema } from "@/modules/procurement/procurement.schema";
import { createPurchaseOrder } from "@/modules/procurement/procurement.service";

export async function POST(request: NextRequest, { params }: { params: Promise<{ homeId: string }> }) {
  return withApiHandler(async () => {
    requireJson(request);

    const { homeId } = await params;
    const context = await buildRequestContext(request, readHomeId({ homeId }));

    const parsed = createPurchaseOrderSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new ValidationError("VAL_INVALID_PAYLOAD", "Invalid purchase order payload", parsed.error.flatten());
    }

    const purchaseOrder = await createPurchaseOrder(parsed.data, context);
    return { purchaseOrder };
  });
}
