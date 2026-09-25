<!--
SCOPE: packages/shared
DOC_KIND: agent-rules
DOC_ROLE: canonical for this folder, extends /AGENTS.md
-->

# packages/shared

Runtime-agnostic contracts imported by api, worker, and web. No framework, Node, or DOM imports: only `zod`.

- One file per domain (`auth.ts`, `queues.ts`, ...), re-exported from `src/index.ts`.
- Response schemas use `z.strictObject`. Request schemas normalize input (`trim`, lower-case emails).
- Adding an error code to `ERROR_CODES` requires its status in the API catalog and its copy in the web app (compile errors guide you).
- Rebuild after a change: `pnpm --filter @groundwork/shared build` (dev mode watches automatically).
