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

export async function getOperationalOverview(ctx: RequestContext) {
  requirePermission(ctx.homeId, "report:read", ctx.user);

  const [children, openIncidents, queuedNotifications, pendingPayroll] = await Promise.all([
    prisma.child.count({ where: { homeId: ctx.homeId, status: "active" } }),
    prisma.incident.count({ where: { homeId: ctx.homeId, status: "open" } }),
    prisma.notification.count({ where: { homeId: ctx.homeId, status: "queued" } }),
    prisma.payrollRun.count({ where: { homeId: ctx.homeId, status: "pending_approval" } })
  ]);

  return {
    children,
    openIncidents,
    queuedNotifications,
    pendingPayroll,
    generatedAt: new Date().toISOString()
  };
}
