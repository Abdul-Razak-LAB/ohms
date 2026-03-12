# OHMS Backend Implementation Status

## Phase 1: Child Operations

Implemented:
- Child onboarding service with idempotency and event append
- Attendance service with idempotent writes
- API routes:
  - POST /api/homes/[homeId]/children
  - POST /api/homes/[homeId]/attendance

## Phase 2: Finance and Payroll

Implemented:
- Expense request service with event append
- Donor allocation service with invariant check (allocation <= donation)
- Payroll approval workflow (multi-approver threshold)
- API routes:
  - POST /api/homes/[homeId]/expenses
  - POST /api/homes/[homeId]/donor-allocations
  - POST /api/homes/[homeId]/payroll/approvals

## Phase 3: Safeguarding and Case Management

Implemented:
- Incident reporting service with auto-escalation for high severity
- Incident escalation API support
- Case plan update service with event append
- API routes:
  - POST /api/homes/[homeId]/incidents
  - PATCH /api/homes/[homeId]/cases/plan

## Phase 4: Sync, Reporting, Notifications, Monitoring

Implemented:
- Incremental sync pull with cursor semantics
- Sync outbox ingest with per-item result handling
- Signed upload metadata pipeline
- Transparency report generation API
- Notification enqueue API
- Health checks and integration status endpoint
- Webhooks:
  - /api/webhooks/payments
  - /api/webhooks/qstash

## Cross-Phase Foundations

Implemented:
- Full Prisma schema covering all required entities
- Environment validation with grouped optional providers
- AppError typed hierarchy and unified response envelope
- Auth + home membership + permission enforcement
- Rate limiting utility (Upstash Redis)
- Serializable retry helper for critical writes
- Event hash-chain append service
- Worker stubs for OCR/transcription/exception detection

## Remaining production hardening tasks

- Run prisma migrate and generate client
- Replace R2 placeholder signed URL with AWS SDK v3 presigner
- Add full integration test suite and e2e sync scenarios
- Add Sentry instrumentation wrappers in all handlers and worker jobs
- Add CSP/security headers middleware globally (next middleware)
- Implement payment provider adapters and webhook replay protection
