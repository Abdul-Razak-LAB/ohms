import { Prisma } from "@prisma/client";
import { prisma } from "@/platform/db/prisma";
import { retrySerializable } from "@/platform/db/tx-retry";
import { requirePermission } from "@/modules/auth/permissions";
import { appendEvent } from "@/modules/events/event.service";
import { AppError } from "@/common/errors/app-error";
import { RequestContext } from "@/common/types/auth";

type ReportIncidentInput = {
  idempotencyKey: string;
  childId?: string;
  category: string;
  severity: "low" | "medium" | "high" | "critical";
};

export async function reportIncident(input: ReportIncidentInput, ctx: RequestContext) {
  requirePermission(ctx.homeId, "incident:create", ctx.user);

  return retrySerializable(() =>
    prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const incident = await tx.incident.upsert({
        where: {
          homeId_idempotencyKey: {
            homeId: ctx.homeId,
            idempotencyKey: input.idempotencyKey
          }
        },
        create: {
          homeId: ctx.homeId,
          childId: input.childId,
          category: input.category,
          severity: input.severity,
          status: "open",
          reportedBy: ctx.user.id,
          idempotencyKey: input.idempotencyKey
        },
        update: {}
      });

      await appendEvent(tx, {
        homeId: ctx.homeId,
        aggregateType: "incident",
        aggregateId: incident.id,
        eventType: "INCIDENT_REPORTED",
        payload: { severity: input.severity, category: input.category },
        actorUserId: ctx.user.id,
        idempotencyKey: `event_${input.idempotencyKey}`
      }).catch(() => undefined);

      if (input.severity === "high" || input.severity === "critical") {
        await tx.incidentEscalation.create({
          data: {
            incidentId: incident.id,
            level: "immediate",
            targetRole: "case_manager",
            dueAt: new Date(Date.now() + 60 * 60 * 1000)
          }
        });
      }

      return incident;
    }, { isolationLevel: "Serializable" })
  );
}

export async function escalateIncident(incidentId: string, ctx: RequestContext) {
  requirePermission(ctx.homeId, "incident:review", ctx.user);

  const incident = await prisma.incident.findUnique({ where: { id: incidentId } });
  if (!incident || incident.homeId !== ctx.homeId) {
    throw new AppError("SAFEGUARDING_INCIDENT_NOT_FOUND", "Incident not found", 404);
  }

  const escalation = await prisma.incidentEscalation.create({
    data: {
      incidentId,
      level: "manual",
      targetRole: "administrator",
      dueAt: new Date(Date.now() + 30 * 60 * 1000)
    }
  });

  return escalation;
}
