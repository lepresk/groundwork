---
name: write-tests
description: Write or extend tests that meet the repository standard (real database, DB-level assertions, schema-parsed responses, AAA). Use when adding tests, fixing coverage, or when a change lacks tests.
---

# Write tests

Pick the level:

| Code under test                 | Level                                | Where                                           |
| ------------------------------- | ------------------------------------ | ----------------------------------------------- |
| Endpoint, action, repository    | Integration                          | `apps/api/test/integration/`                    |
| Pure function, defensive branch | Unit                                 | `apps/<app>/test/unit/`                         |
| Queue processor, email template | Unit + one integration through Redis | `apps/worker/test/`                             |
| Server Action, `lib/`           | Unit (mock `callApi`)                | `apps/web/test/unit/`                           |
| Form, component                 | Component (Testing Library)          | `apps/web/test/component/`, `packages/ui/test/` |

Rules:

- AAA with blank lines. Name tests after behavior.
- Cover: happy path, every error code the code can return, edge cases, weird paths (reuse, replay, expiry, another user's data).
- API tests: `createTestApp()`, `t.reset()` in `beforeEach`, fixtures from `test/helpers/fixtures.ts`, `ErrorResponseSchema` / feature schemas to parse bodies, and a `t.db.select()` assertion after every mutation. Emails: `t.emails()`.
- Never mock Postgres or Redis. Never lower thresholds, skip, or delete tests to get green.
- Check coverage with `pnpm --filter <workspace> test:coverage`.
