import { NextRequest } from "next/server";
import { withApiHandler, requireJson } from "@/common/api/handler";
import { readHomeId } from "@/common/utils/route";
import { buildRequestContext } from "@/common/types/context";
import { markAttendanceSchema } from "@/modules/attendance/attendance.schema";
import { markAttendance } from "@/modules/attendance/attendance.service";
import { ValidationError } from "@/common/errors/app-error";

export async function POST(request: NextRequest, { params }: { params: Promise<{ homeId: string }> }) {
  return withApiHandler(async () => {
    requireJson(request);

    const { homeId } = await params;
    const context = await buildRequestContext(request, readHomeId({ homeId }));

    const parsed = markAttendanceSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new ValidationError("VAL_INVALID_PAYLOAD", "Invalid attendance payload", parsed.error.flatten());
    }

    const attendance = await markAttendance(parsed.data, context);
    return { attendance };
  });
}
