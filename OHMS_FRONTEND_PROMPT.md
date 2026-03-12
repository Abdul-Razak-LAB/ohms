# OHMS Frontend Prompt (Copy/Paste Ready)

You are a senior frontend architect and UI engineer. Build the frontend for a full Orphan Home Management System (OHMS) PWA using the exact quality bar and patterns from a mature Next.js codebase.

## Product Context

Build an offline-first OHMS PWA for five roles:
- Administrator (approvals, compliance oversight, exception handling)
- Caregiver/Staff (daily child care operations and task execution)
- Case Manager/Social Worker (assessments, plans, follow-ups)
- Finance Officer (budgets, expenses, payroll, donor fund tracking)
- Donor/Auditor (restricted transparency views and evidence access)

Full implementation scope:
- Phase 1 complete: child records, attendance, care tasks, daily updates, internal approvals
- Phase 2 complete: budgeting, spend governance, procurement requests, delivery confirmation, reconciliation, payroll workflows
- Phase 3 complete: safeguarding incidents, case management, compliance verification, discrepancy resolution
- Phase 4 complete: operational dashboards, trend/exception monitoring, reporting center, donor transparency views

## Stack And Architecture (Non-Negotiable)

- Framework: Next.js 15 App Router + React 19 + TypeScript strict
- Styling: Tailwind CSS v4 + CSS variables + shadcn/radix UI primitives
- State:
  - TanStack Query for server state
  - Zustand for client-local workflow state
  - React Hook Form + Zod for forms/validation
- PWA:
  - service worker (`/public/sw.js` style) for app-shell caching
  - IndexedDB for offline domain data
  - foreground sync as primary strategy; do not assume reliable background sync on iOS

## UI/Theming Parity (Must Match Existing Product Feel)

- Keep the visual language clean, calm, and trustworthy; avoid flashy or experimental styling.
- Use shadcn/radix components and semantic Tailwind token classes (`bg-background`, `text-foreground`, `border-border`, `text-muted-foreground`).
- Do not hardcode colors in feature components; rely on CSS variables/tokens and theme primitives.
- Preserve multi-theme behavior pattern:
  - default app theme supports light/dark
  - donor/auditor-facing surfaces can be light-forced when needed
  - keep a dedicated theme scope class for external-facing surfaces when applicable
- Maintain strong accessibility defaults:
  - visible focus rings
  - reduced-motion support
  - touch-target sizing
- Keep typography readable and neutral; prioritize hierarchy, spacing, and clarity.
- Keep motion restrained and meaningful (state transitions/feedback), not ornamental.

## Third-Party Integration Parity (Must Be Planned In Frontend)

- Cloudflare R2-compatible media/document pipeline UX:
  - request signed upload URL/token from backend
  - direct upload with progress/error states
  - attachment metadata persisted in outbox event payloads
- Web Push UX:
  - VAPID-driven subscription flow
  - iOS-specific guidance (Home Screen install required before push enablement)
  - graceful fallback to in-app notifications if push unavailable
- Observability:
  - frontend error boundary + Sentry-compatible instrumentation hooks
  - user-facing error states for degraded integrations (upload/email/push unavailable)
- Environment-driven feature gating:
  - hide/disable push/upload-dependent controls when backend marks integration unavailable

## Engineering Patterns To Reuse

- Keep route-facing UI code thin; move logic into hooks/services/util modules
- Enforce organization/home scoping in local cache keys and IndexedDB keys (`homeId`-scoped)
- Use resilient offline queue patterns:
  - outbox records with `PENDING/FAILED`, attempts, `nextAttemptAt`, `lastError`
  - exponential backoff + jitter
  - bounded batch size
  - dedupe in-flight sync calls
- Build around consistent API envelopes:
  - success: `{ success: true, data }`
  - error: `{ success: false, error: { code, message, details? } }`
- Accessibility defaults:
  - visible focus states
  - reduced-motion support
  - 44px minimum touch targets
- Use only library primitives for core controls (button/dialog/select/sheet/etc); do not reimplement primitives from scratch

## Required Frontend Modules (No Omissions)

1. Auth + role-aware shell + permission-gated navigation
2. Child registry and profile UI (identity, guardianship info, documents)
3. Attendance and occupancy dashboard (daily roll call, absence reasons)
4. Care task board (today, overdue, completed) + task templates
5. Care detail + proof capture (photo/video/voice + time/GPS metadata)
6. Meal and nutrition module (meal plans, meal logs, nutrition exceptions)
7. Medication and appointment module (schedule, administered logs, missed-dose alerts)
8. Safeguarding incident module (reporting, escalation, resolution tracking)
9. Case management module (assessments, care plans, follow-ups, outcomes)
10. Spend request flow + approval inbox + budget visibility
11. Procurement UI (purchase requests, PO status, delivery confirmation, discrepancy logging)
12. Payroll workflow UI (run preparation, approvals, payment status visibility)
13. Daily operations update (voice-first + short form fallback)
14. Weekly digest + exception center + trend cards
15. Compliance and audit module (checklists, verification runs, findings)
16. Donor/Auditor portal-lite (restricted report views + evidence attachments)
17. Offline center:
   - connection status
   - pending outbox count
   - manual `Sync now`
   - failed items with retry

## Offline-First Requirements

- IndexedDB stores (minimum):
  - `local_events`
  - `outbox_jobs`
  - `local_children`
  - `local_tasks`
  - `local_incidents`
  - `local_cases`
  - `local_media`
  - `sync_meta`
- All user actions are saved locally first, then queued for sync
- Sync triggers:
  - app open
  - reconnect event
  - manual sync button
  - optional best-effort background sync where available
- Enforce local media safety policy:
  - compress images before store/upload
  - short video policy (5-15s)
  - storage threshold fallback (switch to photo-only when near quota)

## UX And Design Direction

- Mobile-first and staff-usable in low-connectivity environments
- Voice/photo interactions should be primary where appropriate; minimize typing burden
- High-contrast, calm visual system with clear status signaling (`queued`/`synced`/`failed`)
- Keep interaction latency low; optimistic UI where safe
- Ensure excellent behavior on Android Chrome and iOS Safari/Home Screen mode

## Deliverables

Provide:
1. Folder/file structure for frontend implementation
2. Core component and hook implementations (production-grade)
3. Service worker + IndexedDB + outbox sync implementation
4. API client layer with typed contracts and robust error handling
5. Complete screen map and implementations for Administrator/Caregiver/Case Manager/Finance/Donor personas
6. Test plan and sample tests:
   - unit tests for hooks/offline queue/permission logic
   - Playwright flow for `offline action -> reconnect -> synced`
7. Full phased implementation plan (Phase 1 Care Core, Phase 2 Finance Ops, Phase 3 Safeguarding and Cases, Phase 4 Compliance and Transparency) with timeline and milestones

## Acceptance Criteria

- App usable offline for core flows
- No duplicated sync records after retries
- Failed syncs recover with retry/backoff
- Role-based screen access works
- Media/document capture workflow functions on mobile
- Safeguarding + case management + procurement + payroll + compliance modules are fully implemented and navigable
- UI passes accessibility checks for focus states, semantics, and reduced motion

Do not provide vague guidance. Return concrete implementation artifacts, real code, and explicit tradeoffs.
