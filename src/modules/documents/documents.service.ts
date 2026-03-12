import { Prisma } from "@prisma/client";
import { prisma } from "@/platform/db/prisma";
import { retrySerializable } from "@/platform/db/tx-retry";
import { requirePermission } from "@/modules/auth/permissions";
import { appendEvent } from "@/modules/events/event.service";
import { RequestContext } from "@/common/types/auth";
import { AppError } from "@/common/errors/app-error";
import { VerifyDocumentInput } from "@/modules/documents/documents.schema";

export async function verifyDocument(input: VerifyDocumentInput, ctx: RequestContext) {
  requirePermission(ctx.homeId, "document:verify", ctx.user);

  return retrySerializable(() =>
    prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const doc = await tx.childDocument.findUnique({ where: { id: input.childDocumentId } });
      if (!doc || doc.homeId !== ctx.homeId) {
        throw new AppError("DOC_NOT_FOUND", "Child document not found", 404);
      }

      const verified = await tx.childDocument.update({
        where: { id: input.childDocumentId },
        data: {
          verifiedAt: new Date(),
          verifiedBy: ctx.user.id
        }
      });

      await appendEvent(tx, {
        homeId: ctx.homeId,
        aggregateType: "child_document",
        aggregateId: verified.id,
        eventType: "DOCUMENT_VERIFIED",
        payload: { childId: verified.childId, childDocumentId: verified.id },
        actorUserId: ctx.user.id,
        idempotencyKey: input.idempotencyKey
      }).catch(() => undefined);

      return verified;
    }, { isolationLevel: "Serializable" })
  );
}
