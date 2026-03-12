-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "HomeRole" AS ENUM ('administrator', 'finance', 'caregiver', 'case_manager', 'auditor');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('CHILD_REGISTERED', 'ATTENDANCE_MARKED', 'CARE_TASK_COMPLETED', 'MEAL_LOGGED', 'MEDICATION_ADMINISTERED', 'INCIDENT_REPORTED', 'INCIDENT_ESCALATED', 'CASE_PLAN_UPDATED', 'EXPENSE_REQUESTED', 'EXPENSE_APPROVED', 'DONOR_ALLOCATION_APPLIED', 'PO_CREATED', 'PO_DELIVERED', 'PAYROLL_RUN_CREATED', 'AUDIT_COMPLETED', 'DOCUMENT_VERIFIED', 'EXCEPTION_DETECTED');

-- CreateEnum
CREATE TYPE "RecordStatus" AS ENUM ('active', 'archived', 'deleted');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Home" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Home_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomeMembership" (
    "id" TEXT NOT NULL,
    "homeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "HomeRole" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HomeMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Child" (
    "id" TEXT NOT NULL,
    "homeId" TEXT NOT NULL,
    "externalRef" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dob" TIMESTAMP(3),
    "status" "RecordStatus" NOT NULL DEFAULT 'active',
    "deletedAt" TIMESTAMP(3),
    "legalHold" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Child_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChildProfile" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "bloodGroup" TEXT,
    "allergies" JSONB,
    "specialNeeds" JSONB,
    "riskFlags" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChildProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChildGuardian" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ChildGuardian_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChildDocument" (
    "id" TEXT NOT NULL,
    "homeId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "attachmentId" TEXT NOT NULL,
    "docType" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,

    CONSTRAINT "ChildDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceLog" (
    "id" TEXT NOT NULL,
    "homeId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "markedBy" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttendanceLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskTemplate" (
    "id" TEXT NOT NULL,
    "homeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "TaskTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskChecklistItem" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "TaskChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareTask" (
    "id" TEXT NOT NULL,
    "homeId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "templateId" TEXT,
    "title" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "completedBy" TEXT,
    "idempotencyKey" TEXT NOT NULL,

    CONSTRAINT "CareTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealPlan" (
    "id" TEXT NOT NULL,
    "homeId" TEXT NOT NULL,
    "childId" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "plan" JSONB NOT NULL,

    CONSTRAINT "MealPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealLog" (
    "id" TEXT NOT NULL,
    "homeId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "mealAt" TIMESTAMP(3) NOT NULL,
    "details" JSONB NOT NULL,
    "idempotencyKey" TEXT NOT NULL,

    CONSTRAINT "MealLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NutritionFlag" (
    "id" TEXT NOT NULL,
    "homeId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "NutritionFlag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicationPlan" (
    "id" TEXT NOT NULL,
    "homeId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "medication" TEXT NOT NULL,
    "dosage" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),

    CONSTRAINT "MedicationPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicationLog" (
    "id" TEXT NOT NULL,
    "homeId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "medicationPlanId" TEXT,
    "administeredAt" TIMESTAMP(3) NOT NULL,
    "administeredBy" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,

    CONSTRAINT "MedicationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "homeId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Case" (
    "id" TEXT NOT NULL,
    "homeId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "Case_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseAssessment" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "riskScore" INTEGER NOT NULL,
    "assessedBy" TEXT NOT NULL,
    "assessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaseAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CasePlan" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "goals" JSONB NOT NULL,
    "interventions" JSONB NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CasePlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseFollowup" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "followupAt" TIMESTAMP(3) NOT NULL,
    "notes" TEXT NOT NULL,
    "byUserId" TEXT NOT NULL,

    CONSTRAINT "CaseFollowup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Incident" (
    "id" TEXT NOT NULL,
    "homeId" TEXT NOT NULL,
    "childId" TEXT,
    "severity" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "reportedBy" TEXT NOT NULL,
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "idempotencyKey" TEXT NOT NULL,

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentAction" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "byUserId" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncidentAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentEscalation" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "targetRole" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "escalatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "IncidentEscalation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafeguardingReview" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SafeguardingReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL,
    "homeId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "checksumSha256" TEXT NOT NULL,
    "gps" JSONB,
    "deviceInfo" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "homeId" TEXT NOT NULL,
    "aggregateType" TEXT NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "eventType" "EventType" NOT NULL,
    "payload" JSONB NOT NULL,
    "actorUserId" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "prevHash" TEXT,
    "hash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetCycle" (
    "id" TEXT NOT NULL,
    "homeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "BudgetCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetLine" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "allocatedCents" INTEGER NOT NULL,
    "spentCents" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "BudgetLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseRequest" (
    "id" TEXT NOT NULL,
    "homeId" TEXT NOT NULL,
    "budgetLineId" TEXT,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "idempotencyKey" TEXT NOT NULL,

    CONSTRAINT "ExpenseRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Approval" (
    "id" TEXT NOT NULL,
    "homeId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "decidedBy" TEXT NOT NULL,
    "decidedAt" TIMESTAMP(3),
    "comment" TEXT,

    CONSTRAINT "Approval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Donor" (
    "id" TEXT NOT NULL,
    "homeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "restrictions" JSONB,

    CONSTRAINT "Donor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Donation" (
    "id" TEXT NOT NULL,
    "homeId" TEXT NOT NULL,
    "donorId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "restricted" BOOLEAN NOT NULL DEFAULT false,
    "restrictionRef" TEXT,

    CONSTRAINT "Donation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DonorAllocation" (
    "id" TEXT NOT NULL,
    "homeId" TEXT NOT NULL,
    "donationId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "allocatedCents" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "idempotencyKey" TEXT NOT NULL,

    CONSTRAINT "DonorAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FundUtilizationEntry" (
    "id" TEXT NOT NULL,
    "homeId" TEXT NOT NULL,
    "allocationId" TEXT NOT NULL,
    "expenseRequestId" TEXT,
    "amountCents" INTEGER NOT NULL,
    "utilizedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FundUtilizationEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL,
    "homeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "status" TEXT NOT NULL,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseRequest" (
    "id" TEXT NOT NULL,
    "homeId" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,

    CONSTRAINT "PurchaseRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrder" (
    "id" TEXT NOT NULL,
    "homeId" TEXT NOT NULL,
    "requestId" TEXT,
    "vendorId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "orderedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "idempotencyKey" TEXT NOT NULL,

    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PoItem" (
    "id" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "sku" TEXT,
    "description" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "unitPriceCents" INTEGER NOT NULL,

    CONSTRAINT "PoItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryReceipt" (
    "id" TEXT NOT NULL,
    "homeId" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "receivedBy" TEXT NOT NULL,
    "variance" JSONB,
    "idempotencyKey" TEXT NOT NULL,

    CONSTRAINT "DeliveryReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reconciliation" (
    "id" TEXT NOT NULL,
    "homeId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "result" JSONB NOT NULL,

    CONSTRAINT "Reconciliation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorPerformanceMetric" (
    "id" TEXT NOT NULL,
    "homeId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "onTimeScore" DOUBLE PRECISION NOT NULL,
    "qualityScore" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "VendorPerformanceMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollRun" (
    "id" TEXT NOT NULL,
    "homeId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "totalCents" INTEGER NOT NULL DEFAULT 0,
    "idempotencyKey" TEXT NOT NULL,

    CONSTRAINT "PayrollRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollEntry" (
    "id" TEXT NOT NULL,
    "payrollRunId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "grossCents" INTEGER NOT NULL,
    "deductionsCents" INTEGER NOT NULL,
    "netCents" INTEGER NOT NULL,

    CONSTRAINT "PayrollEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollApproval" (
    "id" TEXT NOT NULL,
    "payrollRunId" TEXT NOT NULL,
    "approverId" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "decidedAt" TIMESTAMP(3),

    CONSTRAINT "PayrollApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollPayment" (
    "id" TEXT NOT NULL,
    "homeId" TEXT NOT NULL,
    "payrollRunId" TEXT NOT NULL,
    "gateway" TEXT NOT NULL,
    "gatewayRef" TEXT,
    "status" TEXT NOT NULL,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "PayrollPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditTemplate" (
    "id" TEXT NOT NULL,
    "homeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "checklist" JSONB NOT NULL,

    CONSTRAINT "AuditTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Audit" (
    "id" TEXT NOT NULL,
    "homeId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "Audit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditResult" (
    "id" TEXT NOT NULL,
    "auditId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "findings" JSONB NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "AuditResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceCheck" (
    "id" TEXT NOT NULL,
    "homeId" TEXT NOT NULL,
    "control" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "evidence" JSONB,

    CONSTRAINT "ComplianceCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "homeId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportExport" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "attachmentId" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "generatedBy" TEXT NOT NULL,

    CONSTRAINT "ReportExport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportAccessLog" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "accessedBy" TEXT NOT NULL,
    "accessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "purpose" TEXT,

    CONSTRAINT "ReportAccessLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Device" (
    "id" TEXT NOT NULL,
    "homeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceUid" TEXT NOT NULL,
    "lastSeenAt" TIMESTAMP(3),

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncCursor" (
    "id" TEXT NOT NULL,
    "homeId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "cursor" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SyncCursor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutboxReceipt" (
    "id" TEXT NOT NULL,
    "homeId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "clientEventId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resultCode" TEXT NOT NULL,

    CONSTRAINT "OutboxReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "homeId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "scheduledAt" TIMESTAMP(3),
    "status" TEXT NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationSubscription" (
    "id" TEXT NOT NULL,
    "homeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT,
    "authSecret" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "NotificationSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationDelivery" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "status" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "deliveredAt" TIMESTAMP(3),
    "lastError" TEXT,

    CONSTRAINT "NotificationDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Home_code_key" ON "Home"("code");

-- CreateIndex
CREATE INDEX "HomeMembership_userId_role_idx" ON "HomeMembership"("userId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "HomeMembership_homeId_userId_key" ON "HomeMembership"("homeId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_expiresAt_idx" ON "Session"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "Child_homeId_status_createdAt_idx" ON "Child"("homeId", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Child_homeId_externalRef_key" ON "Child"("homeId", "externalRef");

-- CreateIndex
CREATE UNIQUE INDEX "ChildProfile_childId_key" ON "ChildProfile"("childId");

-- CreateIndex
CREATE INDEX "ChildGuardian_childId_isPrimary_idx" ON "ChildGuardian"("childId", "isPrimary");

-- CreateIndex
CREATE INDEX "ChildDocument_homeId_childId_docType_idx" ON "ChildDocument"("homeId", "childId", "docType");

-- CreateIndex
CREATE INDEX "AttendanceLog_homeId_date_idx" ON "AttendanceLog"("homeId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceLog_homeId_idempotencyKey_key" ON "AttendanceLog"("homeId", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceLog_homeId_childId_date_key" ON "AttendanceLog"("homeId", "childId", "date");

-- CreateIndex
CREATE INDEX "TaskTemplate_homeId_title_idx" ON "TaskTemplate"("homeId", "title");

-- CreateIndex
CREATE INDEX "CareTask_homeId_dueAt_completedAt_idx" ON "CareTask"("homeId", "dueAt", "completedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CareTask_homeId_idempotencyKey_key" ON "CareTask"("homeId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "MealPlan_homeId_startDate_endDate_idx" ON "MealPlan"("homeId", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "MealLog_homeId_childId_mealAt_idx" ON "MealLog"("homeId", "childId", "mealAt");

-- CreateIndex
CREATE UNIQUE INDEX "MealLog_homeId_idempotencyKey_key" ON "MealLog"("homeId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "NutritionFlag_homeId_childId_severity_resolvedAt_idx" ON "NutritionFlag"("homeId", "childId", "severity", "resolvedAt");

-- CreateIndex
CREATE INDEX "MedicationPlan_homeId_childId_startDate_idx" ON "MedicationPlan"("homeId", "childId", "startDate");

-- CreateIndex
CREATE INDEX "MedicationLog_homeId_childId_administeredAt_idx" ON "MedicationLog"("homeId", "childId", "administeredAt");

-- CreateIndex
CREATE UNIQUE INDEX "MedicationLog_homeId_idempotencyKey_key" ON "MedicationLog"("homeId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "Appointment_homeId_scheduledAt_status_idx" ON "Appointment"("homeId", "scheduledAt", "status");

-- CreateIndex
CREATE INDEX "Case_homeId_childId_status_idx" ON "Case"("homeId", "childId", "status");

-- CreateIndex
CREATE INDEX "CaseAssessment_caseId_assessedAt_idx" ON "CaseAssessment"("caseId", "assessedAt");

-- CreateIndex
CREATE INDEX "CasePlan_caseId_updatedAt_idx" ON "CasePlan"("caseId", "updatedAt");

-- CreateIndex
CREATE INDEX "CaseFollowup_caseId_followupAt_idx" ON "CaseFollowup"("caseId", "followupAt");

-- CreateIndex
CREATE INDEX "Incident_homeId_severity_status_reportedAt_idx" ON "Incident"("homeId", "severity", "status", "reportedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Incident_homeId_idempotencyKey_key" ON "Incident"("homeId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "IncidentAction_incidentId_at_idx" ON "IncidentAction"("incidentId", "at");

-- CreateIndex
CREATE INDEX "IncidentEscalation_incidentId_dueAt_resolvedAt_idx" ON "IncidentEscalation"("incidentId", "dueAt", "resolvedAt");

-- CreateIndex
CREATE INDEX "SafeguardingReview_incidentId_reviewedAt_idx" ON "SafeguardingReview"("incidentId", "reviewedAt");

-- CreateIndex
CREATE INDEX "Attachment_homeId_kind_createdAt_idx" ON "Attachment"("homeId", "kind", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Attachment_bucket_objectKey_key" ON "Attachment"("bucket", "objectKey");

-- CreateIndex
CREATE INDEX "Event_homeId_createdAt_idx" ON "Event"("homeId", "createdAt");

-- CreateIndex
CREATE INDEX "Event_homeId_aggregateType_aggregateId_createdAt_idx" ON "Event"("homeId", "aggregateType", "aggregateId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Event_homeId_idempotencyKey_key" ON "Event"("homeId", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "Event_homeId_hash_key" ON "Event"("homeId", "hash");

-- CreateIndex
CREATE INDEX "BudgetCycle_homeId_status_startDate_idx" ON "BudgetCycle"("homeId", "status", "startDate");

-- CreateIndex
CREATE UNIQUE INDEX "BudgetCycle_homeId_name_key" ON "BudgetCycle"("homeId", "name");

-- CreateIndex
CREATE INDEX "BudgetLine_cycleId_category_idx" ON "BudgetLine"("cycleId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "BudgetLine_cycleId_category_key" ON "BudgetLine"("cycleId", "category");

-- CreateIndex
CREATE INDEX "ExpenseRequest_homeId_status_requestedAt_idx" ON "ExpenseRequest"("homeId", "status", "requestedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseRequest_homeId_idempotencyKey_key" ON "ExpenseRequest"("homeId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "Approval_homeId_entityType_entityId_stage_idx" ON "Approval"("homeId", "entityType", "entityId", "stage");

-- CreateIndex
CREATE INDEX "Donor_homeId_name_idx" ON "Donor"("homeId", "name");

-- CreateIndex
CREATE INDEX "Donation_homeId_donorId_receivedAt_idx" ON "Donation"("homeId", "donorId", "receivedAt");

-- CreateIndex
CREATE INDEX "DonorAllocation_homeId_donationId_idx" ON "DonorAllocation"("homeId", "donationId");

-- CreateIndex
CREATE UNIQUE INDEX "DonorAllocation_homeId_idempotencyKey_key" ON "DonorAllocation"("homeId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "FundUtilizationEntry_homeId_allocationId_utilizedAt_idx" ON "FundUtilizationEntry"("homeId", "allocationId", "utilizedAt");

-- CreateIndex
CREATE INDEX "Vendor_homeId_status_idx" ON "Vendor"("homeId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_homeId_name_key" ON "Vendor"("homeId", "name");

-- CreateIndex
CREATE INDEX "PurchaseRequest_homeId_status_idx" ON "PurchaseRequest"("homeId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseRequest_homeId_idempotencyKey_key" ON "PurchaseRequest"("homeId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "PurchaseOrder_homeId_vendorId_status_idx" ON "PurchaseOrder"("homeId", "vendorId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_homeId_idempotencyKey_key" ON "PurchaseOrder"("homeId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "PoItem_purchaseOrderId_idx" ON "PoItem"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "DeliveryReceipt_homeId_receivedAt_idx" ON "DeliveryReceipt"("homeId", "receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryReceipt_homeId_idempotencyKey_key" ON "DeliveryReceipt"("homeId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "Reconciliation_homeId_periodStart_periodEnd_status_idx" ON "Reconciliation"("homeId", "periodStart", "periodEnd", "status");

-- CreateIndex
CREATE UNIQUE INDEX "VendorPerformanceMetric_homeId_vendorId_periodStart_periodE_key" ON "VendorPerformanceMetric"("homeId", "vendorId", "periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "PayrollRun_homeId_status_periodStart_idx" ON "PayrollRun"("homeId", "status", "periodStart");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollRun_homeId_idempotencyKey_key" ON "PayrollRun"("homeId", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollEntry_payrollRunId_userId_key" ON "PayrollEntry"("payrollRunId", "userId");

-- CreateIndex
CREATE INDEX "PayrollApproval_payrollRunId_decision_idx" ON "PayrollApproval"("payrollRunId", "decision");

-- CreateIndex
CREATE INDEX "PayrollPayment_homeId_payrollRunId_status_idx" ON "PayrollPayment"("homeId", "payrollRunId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "AuditTemplate_homeId_name_key" ON "AuditTemplate"("homeId", "name");

-- CreateIndex
CREATE INDEX "Audit_homeId_status_periodStart_idx" ON "Audit"("homeId", "status", "periodStart");

-- CreateIndex
CREATE INDEX "AuditResult_auditId_completedAt_idx" ON "AuditResult"("auditId", "completedAt");

-- CreateIndex
CREATE INDEX "ComplianceCheck_homeId_control_checkedAt_idx" ON "ComplianceCheck"("homeId", "control", "checkedAt");

-- CreateIndex
CREATE INDEX "Report_homeId_kind_generatedAt_idx" ON "Report"("homeId", "kind", "generatedAt");

-- CreateIndex
CREATE INDEX "ReportExport_reportId_format_idx" ON "ReportExport"("reportId", "format");

-- CreateIndex
CREATE INDEX "ReportAccessLog_reportId_accessedAt_idx" ON "ReportAccessLog"("reportId", "accessedAt");

-- CreateIndex
CREATE INDEX "Device_homeId_userId_idx" ON "Device"("homeId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Device_homeId_deviceUid_key" ON "Device"("homeId", "deviceUid");

-- CreateIndex
CREATE UNIQUE INDEX "SyncCursor_homeId_deviceId_key" ON "SyncCursor"("homeId", "deviceId");

-- CreateIndex
CREATE INDEX "OutboxReceipt_homeId_processedAt_resultCode_idx" ON "OutboxReceipt"("homeId", "processedAt", "resultCode");

-- CreateIndex
CREATE UNIQUE INDEX "OutboxReceipt_homeId_deviceId_clientEventId_key" ON "OutboxReceipt"("homeId", "deviceId", "clientEventId");

-- CreateIndex
CREATE INDEX "Notification_homeId_channel_status_scheduledAt_idx" ON "Notification"("homeId", "channel", "status", "scheduledAt");

-- CreateIndex
CREATE INDEX "NotificationSubscription_homeId_userId_channel_isActive_idx" ON "NotificationSubscription"("homeId", "userId", "channel", "isActive");

-- CreateIndex
CREATE INDEX "NotificationDelivery_notificationId_status_idx" ON "NotificationDelivery"("notificationId", "status");

-- AddForeignKey
ALTER TABLE "HomeMembership" ADD CONSTRAINT "HomeMembership_homeId_fkey" FOREIGN KEY ("homeId") REFERENCES "Home"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomeMembership" ADD CONSTRAINT "HomeMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Child" ADD CONSTRAINT "Child_homeId_fkey" FOREIGN KEY ("homeId") REFERENCES "Home"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildProfile" ADD CONSTRAINT "ChildProfile_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildGuardian" ADD CONSTRAINT "ChildGuardian_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildDocument" ADD CONSTRAINT "ChildDocument_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildDocument" ADD CONSTRAINT "ChildDocument_attachmentId_fkey" FOREIGN KEY ("attachmentId") REFERENCES "Attachment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskChecklistItem" ADD CONSTRAINT "TaskChecklistItem_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "TaskTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_homeId_fkey" FOREIGN KEY ("homeId") REFERENCES "Home"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_homeId_fkey" FOREIGN KEY ("homeId") REFERENCES "Home"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_homeId_fkey" FOREIGN KEY ("homeId") REFERENCES "Home"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_homeId_fkey" FOREIGN KEY ("homeId") REFERENCES "Home"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

