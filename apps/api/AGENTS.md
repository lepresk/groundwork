<!--
SCOPE: apps/api
DOC_KIND: agent-rules
DOC_ROLE: canonical for this folder, extends /AGENTS.md
-->

# apps/api

NestJS 11 (Express, ESM, compiled with SWC). Owns business rules, persistence, and authentication.

## Layout

```
src/
  main.ts, app.factory.ts   bootstrap; configureApp() is shared with tests
  app.module.ts             registers modules (gen markers)
  config/env.ts             Zod-validated env, the only process.env reader
  health/                   /health/live and /health/ready
  modules/<feature>/        one folder per feature
    <feature>.controller.ts   thin HTTP layer
    <feature>.schemas.ts      DTOs from shared Zod schemas
    <feature>.repository.ts   Drizzle queries, owner-scoped
    <feature>.mappers.ts      row -> response
    actions/*.action.ts       one use case each, returns Result
  shared/                   cross-feature infrastructure (db, errors, queue, throttling, crypto, pagination)
test/
  integration/              HTTP tests on the real test DB (createTestApp)
  unit/                     pure logic and defensive branches
  helpers/                  test app, fixtures
```

## Rules

- Protect routes with `@Authenticated()` and read the caller with `@CurrentSession()`.
- Declare responses with `@ZodResponse({ status, type })` and errors with `@ApiErrors(...)`.
- Throw `new DomainException(code)` only in controllers, from a failed `Result`. Actions return `fail(code)`.
- Write multi-statement changes in `this.db.transaction(async (tx) => ...)`. Register post-commit side effects with `registerAfterCommitHook`.
- Enqueue jobs through a typed producer (see `shared/queue/email-queue.service.ts`); payload schemas live in `packages/shared/src/queues.ts`.
- `consistent-type-imports` is off here on purpose: type-only imports erase constructor types that Nest DI reads through decorator metadata.

## Tests

- `createTestApp()` boots the real `AppModule` with the production pipeline. `t.reset()` truncates every table and clears recorded emails. `t.agent()` keeps cookies across requests.
- Arrange state with `test/helpers/fixtures.ts` (direct inserts), not through unrelated endpoints.
- Coverage thresholds: 90 / 90 / 90 / 85 (lines, statements, functions, branches).
