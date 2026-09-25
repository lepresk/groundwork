## What

<!-- One or two sentences: what changes and why. Link the issue. -->

## How

<!-- The approach, and anything a reviewer should look at first. -->

## Checklist

- [ ] `pnpm verify` passes locally (format, lint, types, unused code, build, tests)
- [ ] New behavior has tests: happy path, failure paths, edge cases
- [ ] Mutations are asserted at the database level, not only through the response
- [ ] API responses are declared with `@ZodResponse` and new error codes have copy in `apps/web/src/lib/errors.ts`
- [ ] Schema changes ship with a migration (`pnpm db:generate --name <change>`)
- [ ] Docs and agent rules updated if a convention changed (`AGENTS.md`, `docs/`)
