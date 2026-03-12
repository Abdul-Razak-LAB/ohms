import { Prisma } from "@prisma/client";
import { prisma } from "@/platform/db/prisma";
import { retrySerializable } from "@/platform/db/tx-retry";
import { AppError } from "@/common/errors/app-error";
import { RequestContext } from "@/common/types/auth";
import { requirePermission } from "@/modules/auth/permissions";

type ApprovePayrollInput = {
  payrollRunId: string;
  decision: "approved" | "rejected";
};

export async function approvePayrollRun(input: ApprovePayrollInput, ctx: RequestContext) {
  requirePermission(ctx.homeId, "payroll:approve", ctx.user);

  return retrySerializable(() =>
    prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const run = await tx.payrollRun.findUnique({ where: { id: input.payrollRunId } });
      if (!run || run.homeId !== ctx.homeId) {
        throw new AppError("FINANCE_PAYROLL_RUN_NOT_FOUND", "Payroll run not found", 404);
      }

      await tx.payrollApproval.create({
        data: {
          payrollRunId: input.payrollRunId,
          approverId: ctx.user.id,
          decision: input.decision,
          decidedAt: new Date()
        }
      });

      const approvals = await tx.payrollApproval.count({
        where: {
          payrollRunId: input.payrollRunId,
          decision: "approved"
        }
      });

      const status = approvals >= 2 ? "approved" : "pending_approval";
      const updatedRun = await tx.payrollRun.update({
        where: { id: input.payrollRunId },
        data: { status }
      });

      return { payrollRun: updatedRun, approvals };
    }, { isolationLevel: "Serializable" })
  );
}
