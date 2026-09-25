# Copilot instructions

The rules for this repository live in [`AGENTS.md`](../AGENTS.md) at the root, with folder-specific rules in each workspace's `AGENTS.md`. Follow them exactly. The most important ones:

- TypeScript strict: no `any`, no non-null `!`, no `enum`, no `process.env` outside env modules.
- Zod validates every boundary; contracts live in `packages/shared`.
- API: thin controllers, one action per use case returning `Result`, errors as stable codes.
- Web: the browser never calls the API; use Server Components and Server Actions via `callApi`.
- Tests run on a real Postgres; assert mutations in the database; parse responses with the shared schema.
- No em dash and no emoji in code or UI.
- Generate new modules with `pnpm gen module <name>`. Verify with `pnpm verify`.
