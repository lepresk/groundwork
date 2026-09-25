---
name: new-module
description: Create a new feature module (database table, shared contracts, API endpoints, integration tests) with the repository generator. Use when the user asks for a new resource, entity, or feature area such as "add invoices" or "we need projects".
---

# New feature module

Never hand-write a module skeleton. The generator produces code that already passes lint, types, and tests.

1. Pick the singular kebab-case name (`invoice`, `api-key`). Irregular plural: pass `--plural`.
2. Run `pnpm gen module <name>` and read the list of created and updated files.
3. Rebuild contracts: `pnpm --filter @groundwork/db --filter @groundwork/shared build`.
4. Replace the placeholder `name` column with the real fields, in this order, keeping them consistent:
   - `packages/db/src/schema/<plural>.ts` (columns, indexes, foreign keys with explicit `onDelete`)
   - `packages/shared/src/<plural>.ts` (response `strictObject`, request schema with normalization)
   - `apps/api/src/modules/<plural>/<plural>.mappers.ts` and the repository `create` input
   - `apps/api/test/integration/<plural>.test.ts` (extend, never delete, the generated cases)
5. Generate the migration: `pnpm db:generate --name add_<plural>`, review the SQL, then `pnpm db:migrate`.
6. Add new error codes the usual way (shared registry, API catalog, web copy). Compile errors list the missing entries.
7. Run the `verify` skill.

Report the endpoints created and the migration name.
