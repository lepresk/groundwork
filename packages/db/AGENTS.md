<!--
SCOPE: packages/db
DOC_KIND: agent-rules
DOC_ROLE: canonical for this folder, extends /AGENTS.md
-->

# packages/db

Drizzle schema, SQL migrations, and the `createDatabase()` factory used by api and worker.

## Changing the schema

1. Edit or add a table in `src/schema/` (one file per aggregate) and export it from `src/schema/index.ts`.
2. `pnpm --filter @groundwork/db build`
3. `pnpm db:generate --name <descriptive_snake_case>` and review the SQL.
4. `pnpm db:migrate`

## Rules

- Columns use camelCase in TypeScript; the client maps them to snake_case (`casing: 'snake_case'`).
- Use `id()` and `timestamps` from `_columns.ts`. Every timestamp is `timestamptz`.
- Foreign keys declare `onDelete` explicitly. Add an index for every foreign key used in lookups.
- Store secrets encrypted and tokens hashed; never plain text.
- Never edit a migration that has been applied anywhere. Write a new one.
