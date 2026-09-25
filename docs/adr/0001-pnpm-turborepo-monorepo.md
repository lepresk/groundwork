<!--
SCOPE: decision record: 0001. pnpm workspaces and Turborepo
DOC_KIND: record
DOC_ROLE: canonical
READ_WHEN: you need the rationale behind this decision or plan to change it
SKIP_WHEN: you only need the current convention
PRIMARY_SOURCES: /AGENTS.md
-->

# 0001. pnpm workspaces and Turborepo

- **Status:** accepted

## Context

The api, worker, and web apps share contracts, database code, and tooling. Separate repositories would duplicate contracts and let them drift, and cross-cutting changes would need coordinated releases.

## Decision

One repository with pnpm workspaces (`apps/*`, `packages/*`) and Turborepo for task orchestration and caching. Internal packages are consumed through `workspace:*`. pnpm is pinned via `packageManager`; `minimumReleaseAge` and an `allowBuilds` allowlist harden the supply chain.

## Consequences

- A contract change and all its consumers ship in one pull request, checked by one CI run.
- `turbo.json` declares task dependencies (`^build`) and the env variables each task may see (strict env mode).
- Libraries compile to `dist/` (`shared`, `db`) or are consumed as source (`ui`), so each package declares how it is built.
