# OHMS Backend

Enterprise-grade backend scaffold for Orphan Home Management System (OHMS), implemented with Next.js App Router, Prisma, PostgreSQL, and modular domain services.

## What is implemented

- Phase 1: child onboarding, attendance, caregiving operations foundations
- Phase 2: budgeting/expenses, donor allocation invariants, payroll approval workflow
- Phase 3: safeguarding incidents, escalation, case plan updates
- Phase 4: sync API, signed uploads metadata pipeline, reports, notifications, health and webhooks

Full status: see IMPLEMENTATION_PHASES.md

## Project structure

- src/app/api: route handlers (thin controllers)
- src/modules: domain services (business logic)
- src/platform: adapters (db, config, cache, security, observability)
- src/common: errors, API helpers, shared types/utilities
- src/worker: async background job entrypoints
- prisma/schema.prisma: full domain model with idempotency constraints

## Setup

1. Copy .env.example to .env and fill required values.
2. Install dependencies:
   - npm install
3. Generate Prisma client:
   - npx prisma generate
4. Create DB schema:
   - npx prisma migrate dev --name init
5. Run API:
   - npm run dev
6. Run tests:
   - npm test

## Key guarantees

- Unified API envelope for success and errors
- Typed domain errors
- Serializable transaction retry helper
- Tenant isolation via home-scoped auth and permission checks
- Idempotent writes through homeId + idempotencyKey uniqueness
- Append-only event stream with tamper-evident hash chain fields
- Offline sync ingest with per-item outcomes
