import { NextRequest } from "next/server";
import { withApiHandler, requireJson } from "@/common/api/handler";
import { readHomeId } from "@/common/utils/route";
import { buildRequestContext } from "@/common/types/context";
import { createExpenseRequestSchema } from "@/modules/finance/expenses/expenses.schema";
import { createExpenseRequest } from "@/modules/finance/expenses/expenses.service";
import { ValidationError } from "@/common/errors/app-error";

export async function POST(request: NextRequest, { params }: { params: Promise<{ homeId: string }> }) {
  return withApiHandler(async () => {
    requireJson(request);

    const { homeId } = await params;
    const context = await buildRequestContext(request, readHomeId({ homeId }));

    const parsed = createExpenseRequestSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new ValidationError("VAL_INVALID_PAYLOAD", "Invalid expense payload", parsed.error.flatten());
    }

    const expenseRequest = await createExpenseRequest(parsed.data, context);
    return { expenseRequest };
  });
}
