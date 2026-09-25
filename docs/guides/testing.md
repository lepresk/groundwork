<!--
SCOPE: test levels, harness, coverage thresholds, and CI test jobs
DOC_KIND: reference
DOC_ROLE: canonical
READ_WHEN: you write, fix, or run tests
SKIP_WHEN: you do not touch behavior
PRIMARY_SOURCES: apps/*/vitest.config.ts, apps/api/test/helpers, .github/workflows/ci.yml
-->

# Testing

## Levels

| Level           | Where                                  | Real dependencies                             | Replaced                                                 |
| --------------- | -------------------------------------- | --------------------------------------------- | -------------------------------------------------------- |
| API integration | `apps/api/test/integration`            | Postgres (test DB), Redis, full Nest pipeline | BullMQ queue (recorder)                                  |
| API unit        | `apps/api/test/unit`                   | None                                          | Collaborators via constructor mocks                      |
| Worker          | `apps/worker/test`                     | Redis and BullMQ in the integration suite     | Mail transport (recorder), nodemailer in unit tests      |
| Web             | `apps/web/test/unit`, `test/component` | jsdom                                         | `callApi`, Server Actions, `next/*` at module boundaries |
| UI              | `packages/ui/test`                     | jsdom                                         | None                                                     |
| Contracts       | `packages/shared/test`                 | None                                          | None                                                     |

## API harness

| Helper                                                           | File                       | Use                                                                                                                 |
| ---------------------------------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `createTestApp()`                                                | `test/helpers/test-app.ts` | Boots `AppModule` with `configureApp()`; returns `app`, `db`, `http()`, `agent()`, `emails()`, `reset()`, `close()` |
| `t.reset()`                                                      | same                       | Truncates every table in `public` (discovered dynamically) and clears recorded jobs; call in `beforeEach`           |
| `t.emails()`                                                     | same                       | Enqueued email jobs, parsed with `EmailJobSchema`                                                                   |
| `t.agent()`                                                      | same                       | Supertest agent that keeps cookies across requests                                                                  |
| `tokenFromLink(url)`                                             | same                       | Extracts `?token=` from an emailed link                                                                             |
| `createUser`, `enableTwoFactor`, `totpCode`, `expireAllSessions` | `test/helpers/fixtures.ts` | Direct inserts to arrange state                                                                                     |

Migrations run once per run in `test/global-setup.ts`. `test/load-test-env.ts` loads the root `.env` when present, binds `DATABASE_URL` to `DATABASE_URL_TEST`, and refuses to start without it. Test files run serially because they share one database.

## Policy

- Never mock Postgres or Redis in integration tests.
- Assert every mutation in the database (`t.db.select().from(table)`).
- Parse every response with its shared schema (`ErrorResponseSchema.parse(response.body)`).
- AAA with blank lines; behavior-named tests; cover failures, edge cases, and replay or expiry paths.

## Coverage thresholds

| Workspace         | Lines | Statements | Functions | Branches | Measured on                                 |
| ----------------- | ----- | ---------- | --------- | -------- | ------------------------------------------- |
| `apps/api`        | 90    | 90         | 90        | 85       | `src/**` except `main.ts`, modules, schemas |
| `apps/worker`     | 90    | 90         | 90        | 85       | `src/**` except `main.ts`, modules          |
| `apps/web`        | 90    | 90         | 90        | 85       | `src/lib/**`, `src/features/**`             |
| `packages/ui`     | 90    | 90         | 90        | 85       | `src/**`                                    |
| `packages/shared` | 90    | 90         | 90        | 90       | `src/**`                                    |

## Running tests

| Goal                               | Command                                                                             |
| ---------------------------------- | ----------------------------------------------------------------------------------- |
| Everything (needs `pnpm infra:up`) | `pnpm test`                                                                         |
| With coverage                      | `pnpm test:coverage`                                                                |
| One workspace                      | `pnpm --filter @groundwork/api test`                                                |
| One file                           | `pnpm --filter @groundwork/api exec vitest run test/integration/auth-login.test.ts` |
| One test by name                   | `pnpm --filter @groundwork/api exec vitest run -t "rejects a tampered cookie"`      |
| Watch                              | `pnpm --filter @groundwork/api test:watch`                                          |

## CI jobs

| Job                  | Runs                                                                 |
| -------------------- | -------------------------------------------------------------------- |
| Quality gates        | format, text hygiene, sherif, lint, typecheck, knip                  |
| Conventional commits | commitlint on the pull request range                                 |
| Tests                | `pnpm test:coverage` with Postgres and Redis services                |
| Generator            | `pnpm gen module sample-item`, migration, typecheck, lint, API tests |
| Build                | `pnpm build`                                                         |
| Docker images        | Builds the three images (no push)                                    |
