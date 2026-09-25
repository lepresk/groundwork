<!--
SCOPE: index of architecture decision records
DOC_KIND: index
DOC_ROLE: navigation
READ_WHEN: you want to know why a structural decision was made
SKIP_WHEN: you need a convention, not its rationale
PRIMARY_SOURCES: docs/adr/*.md
-->

# Architecture decision records

| #                                            | Decision                                        | Status   |
| -------------------------------------------- | ----------------------------------------------- | -------- |
| [0001](0001-pnpm-turborepo-monorepo.md)      | pnpm workspaces + Turborepo monorepo            | accepted |
| [0002](0002-bff-with-private-api.md)         | Next.js server as BFF, API on a private network | accepted |
| [0003](0003-server-side-sessions.md)         | Server-side sessions instead of JWT             | accepted |
| [0004](0004-action-pattern-with-result.md)   | Action pattern returning `Result` types         | accepted |
| [0005](0005-shared-zod-contracts.md)         | Zod contracts in a shared package               | accepted |
| [0006](0006-drizzle-sql-migrations.md)       | Drizzle ORM with generated SQL migrations       | accepted |
| [0007](0007-real-infrastructure-in-tests.md) | Integration tests on real Postgres and Redis    | accepted |
| [0008](0008-worker-process-after-commit.md)  | Separate BullMQ worker, after-commit enqueueing | accepted |

New ADR: copy the format (Status, Context, Decision, Consequences), next number, kebab-case title.
