import { prisma } from "@/platform/db/prisma";
import { requirePermission } from "@/modules/auth/permissions";
import { RequestContext } from "@/common/types/auth";

export async function generateTransparencyReport(
  ctx: RequestContext,
  kind: string,
  periodStart: Date,
  periodEnd: Date
) {
  requirePermission(ctx.homeId, "report:read", ctx.user);

  return prisma.report.create({
    data: {
      homeId: ctx.homeId,
      kind,
      periodStart,
      periodEnd
    }
  });
}
