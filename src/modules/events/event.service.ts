import { Prisma } from "@prisma/client";
import { createHash } from "node:crypto";

type EventInput = {
  homeId: string;
  aggregateType: string;
  aggregateId: string;
  eventType:
    | "CHILD_REGISTERED"
    | "ATTENDANCE_MARKED"
    | "CARE_TASK_COMPLETED"
    | "MEAL_LOGGED"
    | "MEDICATION_ADMINISTERED"
    | "INCIDENT_REPORTED"
    | "INCIDENT_ESCALATED"
    | "CASE_PLAN_UPDATED"
    | "EXPENSE_REQUESTED"
    | "EXPENSE_APPROVED"
    | "DONOR_ALLOCATION_APPLIED"
    | "PO_CREATED"
    | "PO_DELIVERED"
    | "PAYROLL_RUN_CREATED"
    | "AUDIT_COMPLETED"
    | "DOCUMENT_VERIFIED"
    | "EXCEPTION_DETECTED";
  payload: Prisma.InputJsonValue;
  actorUserId?: string;
  idempotencyKey: string;
};

function hashPayload(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export async function appendEvent(tx: Prisma.TransactionClient, input: EventInput) {
  const previous = await tx.event.findFirst({
    where: { homeId: input.homeId },
    orderBy: { createdAt: "desc" }
  });

  const prevHash = previous?.hash ?? null;
  const hash = hashPayload({
    homeId: input.homeId,
    aggregateType: input.aggregateType,
    aggregateId: input.aggregateId,
    eventType: input.eventType,
    payload: input.payload,
    prevHash
  });

  return tx.event.create({
    data: {
      homeId: input.homeId,
      aggregateType: input.aggregateType,
      aggregateId: input.aggregateId,
      eventType: input.eventType,
      payload: input.payload,
      actorUserId: input.actorUserId,
      idempotencyKey: input.idempotencyKey,
      prevHash,
      hash
    }
  });
}
