# OHMS Backend Release Checklist

## Pre-Release

- Ensure all required environment variables are set for target environment.
- Confirm `DATABASE_URL` points to the correct staging or production database.
- Run `npm install` and `npm run typecheck`.
- Run full test suite: `npm test`.
- Verify security middleware and cron secret are enabled.
- Verify payment webhook secret and provider settings for target environment.
- Verify R2 storage credentials and bucket are configured.

## Migration And Data

- Generate Prisma client: `npx prisma generate`.
- Apply migrations: `npx prisma migrate deploy`.
- Run seed fixtures for non-production or controlled production bootstrapping: `npm run prisma:seed`.
- Validate critical tables contain expected baseline data (`Home`, `User`, `HomeMembership`, `Child`).

## Staging Deployment

- Run `npm run deploy:staging`.
- Smoke test API health endpoint.
- Validate core flows: child onboarding, attendance, sync push/pull, notifications, reports.
- Validate webhook endpoints with signed test payloads.
- Validate worker job dispatch via QStash.

## Production Deployment

- Confirm release tag and rollback point are recorded.
- Run `npm run deploy:prod`.
- Run post-deploy smoke checks:
  - health status
  - authentication/session flow
  - sync incremental cursor behavior
  - payment webhook verification
- Monitor logs/Sentry for 30 minutes after deployment.

## Rollback Plan

- Stop traffic to current deployment if severe issue is detected.
- Re-deploy previous stable artifact.
- Restore database from last verified backup if migration rollback is required.
- Re-run smoke tests and incident review.
