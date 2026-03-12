import { NextRequest } from "next/server";
import { withApiHandler, requireJson } from "@/common/api/handler";
import { readHomeId } from "@/common/utils/route";
import { buildRequestContext } from "@/common/types/context";
import { ValidationError } from "@/common/errors/app-error";
import { completeCareTaskSchema } from "@/modules/care/tasks.schema";
import { completeCareTask } from "@/modules/care/tasks.service";

export async function POST(request: NextRequest, { params }: { params: Promise<{ homeId: string }> }) {
  return withApiHandler(async () => {
    requireJson(request);

    const { homeId } = await params;
    const context = await buildRequestContext(request, readHomeId({ homeId }));

    const parsed = completeCareTaskSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new ValidationError("VAL_INVALID_PAYLOAD", "Invalid care task payload", parsed.error.flatten());
    }

    const task = await completeCareTask(parsed.data, context);
    return { task };
  });
}
