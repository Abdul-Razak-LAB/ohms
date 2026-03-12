# OHMS Backend Prompt (Copy/Paste Ready)

You are a senior backend/platform architect. Design and implement the backend for a full Orphan Home Management System (OHMS) using enterprise-grade patterns from a production Next.js + Prisma system.

## Product Context

Build complete backend coverage for:
- Phase 1 complete: child onboarding/registry, attendance, caregiver task execution, daily operational updates
- Phase 2 complete: budgeting, donor fund governance, procurement lifecycle, reconciliation, payroll workflows
- Phase 3 complete: safeguarding incidents, case management, compliance/audit workflows, document verification
- Phase 4 complete: analytics/monitoring, exception detection, notification orchestration, transparency reporting

## Stack And Architecture (Non-Negotiable)

- Runtime/API: Next.js App Router route handlers (or equivalent Node service style), TypeScript strict
- Data: PostgreSQL + Prisma ORM
- Storage: S3-compatible object storage for media and documents
- Async jobs: queue worker (Redis/SQS equivalent)
- Validation: Zod schemas at API boundaries
- Observability: structured logger with PII redaction + Sentry-style exception capture

## Third-Party Integration Parity (Match Production Discipline)

Explicitly design these integrations from day one:
- Email: Resend provider abstraction with quota/rate controls
- Storage: Cloudflare R2 (S3-compatible) for media/documents/exports, with signed upload flow
- Cache/Rate limit: Upstash Redis for shared rate limits and cached dashboards/reports
- Delayed jobs: Upstash QStash (or equivalent) for reminders/escalations/scheduled reports
- Payments (production-ready): gateway interface pattern for payroll/disbursement adapters and webhook verification flows
- Push notifications: Web Push with VAPID key management and subscription lifecycle
- Error monitoring: Sentry-compatible capture in API handlers and background workers
- Health checks: integration-aware status checks (DB, Redis, storage, email, payment)

## Core Architectural Rules

- Keep route handlers thin:
  - parse + validate input
  - auth/permission/rate-limit checks
  - call service layer
  - return unified response envelope
- Unified response format:
  - success: `{ success: true, data }`
  - error: `{ success: false, error: { code, message, details? } }`
- Domain errors must be typed (`AppError` subclasses with status + error code)
- Critical writes use serializable transactions + retry on retryable DB conflicts

## Domain Model Requirements

Implement append-only event-driven core.

Minimum entities:
- `users`, `homes`, `home_memberships` (administrator/finance/caregiver/case_manager/auditor)
- `children`, `child_profiles`, `child_guardians`, `child_documents`
- `attendance_logs`, `care_tasks`, `task_templates`, `task_checklist_items`
- `meal_plans`, `meal_logs`, `nutrition_flags`
- `medication_plans`, `medication_logs`, `appointments`
- `cases`, `case_assessments`, `case_plans`, `case_followups`
- `incidents`, `incident_actions`, `incident_escalations`, `safeguarding_reviews`
- `events` (append-only timeline)
- `attachments/media` (object storage metadata + hash)
- `budget_cycles`, `budget_lines`, `expense_requests`, `approvals`
- `donors`, `donations`, `donor_allocations`, `fund_utilization_entries`
- `purchase_requests`, `purchase_orders`, `po_items`, `delivery_receipts`, `reconciliations`
- `vendors`, `vendor_performance_metrics`
- `payroll_runs`, `payroll_entries`, `payroll_approvals`, `payroll_payments`
- `audits`, `audit_templates`, `audit_results`, `compliance_checks`
- `reports`, `report_exports`, `report_access_logs`
- `devices`, `sync_cursors`, `outbox_receipts` (sync reliability)
- `notifications`, `notification_subscriptions`, `notification_deliveries`

Event examples:
- `CHILD_REGISTERED`
- `ATTENDANCE_MARKED`
- `CARE_TASK_COMPLETED`
- `MEAL_LOGGED`
- `MEDICATION_ADMINISTERED`
- `INCIDENT_REPORTED`
- `INCIDENT_ESCALATED`
- `CASE_PLAN_UPDATED`
- `EXPENSE_REQUESTED`
- `EXPENSE_APPROVED`
- `DONOR_ALLOCATION_APPLIED`
- `PO_CREATED`
- `PO_DELIVERED`
- `PAYROLL_RUN_CREATED`
- `AUDIT_COMPLETED`
- `DOCUMENT_VERIFIED`
- `EXCEPTION_DETECTED`

## Data Integrity + Idempotency

- Every client write endpoint must accept `idempotencyKey` (or equivalent client event ID)
- Enforce uniqueness at DB level (`homeId + idempotencyKey`)
- For offline sync batch ingestion:
  - process each record independently
  - return per-record result (`success`, `error`, `code`)
  - do not fail whole batch for partial failures
- Optional but preferred: tamper-evident hash chain in events (`prev_hash`, `hash`)

## Security Requirements

- Cookie/session auth with hashed stored session tokens
- Role/permission checks per home scope (`requirePermission(homeId, permission)`)
- Same-origin checks for state-changing browser requests
- Rate limiting profiles by IP/user/home for sensitive endpoints
- Strict env validation in startup (`DATABASE_URL`, app URL, secrets)
- Security headers/CSP policy and protected cron endpoints via secret
- Field-level protections for sensitive child data (principle of least privilege)
- Audit log for all safeguarding and financial approvals

## Environment And Configuration Requirements

- Implement strict env validation at startup with:
  - hard fail in production on missing required vars
  - clear warnings for optional but configured features
- Include env groups for:
  - core app/database/auth
  - R2 storage
  - Resend email
  - Redis/QStash
  - payment gateways
  - VAPID push
  - Sentry

## Offline Sync API Requirements

Provide endpoints equivalent to:
- `GET /api/homes/:homeId/sync?cursor=...`
  - returns incremental dataset and `nextCursor`
  - includes deletions/tombstones
  - bounded payload with pagination support
- `POST /api/homes/:homeId/sync`
  - accepts batch outbox events
  - max batch size enforced
  - idempotent processing
  - per-item result payload

Behavior:
- Treat transient errors separately from permanent validation/business failures
- Return machine-readable error codes for retry classification
- Log sync summaries with counts by failure code

## Media And Document Pipeline Requirements

- Signed upload URLs (short TTL)
- Content-type + max-size validation by folder/media type
- Metadata capture: timestamp, GPS (if available), device info, checksum
- Async post-processing jobs for:
  - voice note transcription
  - document OCR (receipts/medical notes/consent forms)
  - report summarization
  - anti-duplication/media integrity checks

## Compliance And Privacy Requirements

- Data retention policies by record type (incidents, medical logs, payroll, donor reports)
- Soft delete + legal hold support for protected records
- Export/audit endpoints for authorized regulators/auditors
- Immutable traceability for safeguarding decisions and donor fund utilization
- Redaction strategy for external donor/auditor views

## Testing And Quality Gates

- Unit tests for service-layer business rules
- Integration tests for:
  - idempotent writes
  - permission boundaries
  - transaction retry behavior
  - sync incremental cursor semantics
  - donor fund allocation invariants
  - payroll approval and posting rules
  - safeguarding incident escalation rules
  - case management state transitions
- E2E/API scenario:
  - offline-created records sync after reconnect without duplicates

## Deliverables

Return:
1. Proposed folder architecture
2. Prisma schema draft + indexes + uniqueness constraints
3. Endpoint contract list (request/response)
4. Service-layer pseudocode and key concrete implementations
5. Error code catalog and retry policy matrix
6. Security checklist mapped to implemented middleware
7. Compliance/privacy checklist with concrete controls
8. Full phased implementation plan with deliverables per phase and timeline for complete scope

## Constraints

- No hand-wavy output
- No "single giant service"; enforce modular domain services
- No coupling UI concerns into backend domain logic
- Design for multi-tenant home isolation from day one
- Implement all requested modules in phased sequence until complete

Produce concrete, implementation-ready backend artifacts..
