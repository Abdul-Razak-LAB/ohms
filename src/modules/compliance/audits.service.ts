import { Prisma } from "@prisma/client";
import { prisma } from "@/platform/db/prisma";
import { retrySerializable } from "@/platform/db/tx-retry";
import { requirePermission } from "@/modules/auth/permissions";
import { appendEvent } from "@/modules/events/event.service";
import { RequestContext } from "@/common/types/auth";
import { AppError } from "@/common/errors/app-error";
import { CompleteAuditInput } from "@/modules/compliance/audits.schema";

export async function completeAudit(input: CompleteAuditInput, ctx: RequestContext) {
  requirePermission(ctx.homeId, "audit:write", ctx.user);

  return retrySerializable(() =>
    prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const audit = await tx.audit.findUnique({ where: { id: input.auditId } });
      if (!audit || audit.homeId !== ctx.homeId) {
        throw new AppError("COMPLIANCE_AUDIT_NOT_FOUND", "Audit not found", 404);
      }

      const result = await tx.auditResult.create({
        data: {
          auditId: input.auditId,
          score: input.score,
          findings: input.findings as never,
          completedAt: new Date()
        }
      });

      await tx.audit.update({
        where: { id: input.auditId },
        data: { status: "completed" }
      });

      await appendEvent(tx, {
        homeId: ctx.homeId,
        aggregateType: "audit",
        aggregateId: input.auditId,
        eventType: "AUDIT_COMPLETED",
        payload: { resultId: result.id, score: input.score },
        actorUserId: ctx.user.id,
        idempotencyKey: input.idempotencyKey
      }).catch(() => undefined);

      return result;
    }, { isolationLevel: "Serializable" })
  );
}
