---
name: verify
description: Run the definition-of-done checks and report results faithfully. Use before saying a change is complete, before committing, or when asked whether something works.
---

# Verify

1. Make sure infrastructure runs: `docker compose ps` (start it with `pnpm infra:up` if needed).
2. Run the full gate: `pnpm verify`. For a narrow change you may run, for each touched workspace:
   `pnpm --filter <workspace> lint`, `typecheck`, `test:coverage`, plus `pnpm format:check`, `pnpm check:text`, `pnpm check:unused`.
3. If something fails, fix the cause. Do not skip tests, lower thresholds, add `eslint-disable`, or cast to silence types.
4. Report exactly what ran and the result. Quote the failing output when something is red. Say explicitly which checks you did not run.
