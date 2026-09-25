# Contributing

Thanks for helping improve Groundwork.

## Setup

Follow [docs/guides/getting-started.md](docs/guides/getting-started.md). You need Node 24, pnpm 11, and Docker.

## Workflow

1. Open an issue first for anything larger than a small fix, so we agree on the approach.
2. Branch from `main`: `<type>/<short-description>` (`feat/`, `fix/`, `docs/`, ...).
3. Follow [AGENTS.md](AGENTS.md). It is the rulebook for humans and AI agents alike.
4. Add tests for every behavior change. `pnpm verify` must pass locally.
5. Commit with Conventional Commits (`feat(api): ...`). The `commit-msg` hook validates it.
6. Open a pull request using the template. CI must be green.

## What makes a good change here

- It keeps the template blank: infrastructure and conventions, not business features.
- It removes more complexity than it adds.
- It is enforced by a tool (lint rule, type, check, test) rather than only documented.
