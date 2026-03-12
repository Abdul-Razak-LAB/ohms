import { NextRequest } from "next/server";
import { withApiHandler } from "@/common/api/handler";
import { readHomeId } from "@/common/utils/route";
import { buildRequestContext } from "@/common/types/context";
import { getOperationalOverview } from "@/modules/reporting/reports.service";

export async function GET(request: NextRequest, { params }: { params: Promise<{ homeId: string }> }) {
  return withApiHandler(async () => {
    const { homeId } = await params;
    const context = await buildRequestContext(request, readHomeId({ homeId }));
    const overview = await getOperationalOverview(context);
    return { overview };
  });
}
