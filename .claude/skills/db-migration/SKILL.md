---
name: db-migration
description: Change the database schema safely with Drizzle migrations. Use for any new column, table, index, constraint, or rename.
---

# Database migration

1. Edit the table in `packages/db/src/schema/`. Use `id()` and `timestamps` from `_columns.ts`, `timestamptz`, explicit `onDelete`, and an index for looked-up foreign keys.
2. `pnpm --filter @groundwork/db build`
3. `pnpm db:generate --name <descriptive_snake_case>` (for example `add_invoice_due_date`).
4. Read the generated SQL. Check for:
   - destructive statements (`DROP`, type changes) on tables with data: split into expand, backfill, contract migrations;
   - `NOT NULL` columns added without a default on a populated table;
   - missing indexes for new foreign keys.
5. `pnpm db:migrate`, then run the affected API tests (the test database migrates automatically).
6. Never edit a migration that was applied anywhere (CI, staging, production). Write a new one.
