# Groundwork

**A production-grade NestJS + Next.js monorepo starter, built to be extended by humans and AI agents alike.**

Fork it, run one command to rename it, and start writing features on top of a foundation that already has authentication, a background worker, strict quality gates, and the rules that keep AI-generated code consistent.

[![CI](https://github.com/lepresk/groundwork/actions/workflows/ci.yml/badge.svg)](https://github.com/lepresk/groundwork/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![Node 24](https://img.shields.io/badge/node-24-green.svg)

---

## Why this template

Most starters give you a folder structure. This one gives you a **working system with its conventions enforced by tools**:

- **Blank, not empty.** No demo domain to delete. What ships is what every product needs: sign up, email verification, sessions, password reset, TOTP two-factor, a job queue, health checks.
- **Contracts, not guesses.** One Zod schema validates the request in the browser, again in the Server Action, again in the API, and checks the response shape before it leaves. A leaked field fails the test suite.
- **A BFF by default.** The browser only talks to the Next.js server. The API stays on a private network, the session cookie stays HttpOnly, and there is no CORS to configure.
- **Tests that catch real bugs.** Integration tests run against a real Postgres and Redis. Mutations are asserted in the database, not trusted from the response.
- **AI-ready.** A single canonical `AGENTS.md`, scoped rules per workspace, Claude Code skills, subagents, and hooks, Cursor rules, and a deterministic code generator so agents extend the codebase instead of reinventing it.

## Stack

| Layer      | Choice                                                                  |
| ---------- | ----------------------------------------------------------------------- |
| Monorepo   | pnpm 11 workspaces, Turborepo                                           |
| Language   | TypeScript 6, strictest settings, ESM everywhere, Node 24               |
| API        | NestJS 11, SWC, nestjs-zod, Swagger/OpenAPI, pino                       |
| Database   | PostgreSQL 18, Drizzle ORM, SQL migrations                              |
| Jobs       | BullMQ on Redis 8, separate worker process                              |
| Web        | Next.js 16 App Router, React 19, Server Actions, Tailwind CSS v4        |
| Auth       | Server-side sessions (iron-session + registry), argon2id, TOTP 2FA      |
| Validation | Zod 4 contracts shared across every app                                 |
| Testing    | Vitest, Supertest, Testing Library, real Postgres and Redis             |
| Quality    | ESLint (type-checked strict), Prettier, knip, sherif, commitlint, husky |
| Delivery   | Multi-stage Docker images, GitHub Actions, CodeQL, Dependabot           |

## Quick start

Prerequisites: Node 24, pnpm 11, Docker.

```bash
pnpm install
pnpm setup          # creates .env files with generated secrets
pnpm infra:up       # Postgres, Redis, Mailpit
pnpm build
pnpm db:migrate
pnpm dev            # api, worker, web in watch mode
```

| Service      | URL                               |
| ------------ | --------------------------------- |
| Web app      | http://localhost:3000             |
| API docs     | http://localhost:3001/api/v1/docs |
| Emails (dev) | http://localhost:8025             |

Starting a real project from the template:

```bash
pnpm rename acme-billing --title "Acme Billing"
pnpm install
```

## What is inside

```
apps/
  api/         NestJS API: auth module, action pattern, error catalog, health, throttling
  worker/      BullMQ consumers: transactional emails over SMTP
  web/         Next.js BFF: auth pages, account security, typed API calls
packages/
  shared/      Zod contracts: DTOs, error codes, queue payloads
  db/          Drizzle schema, migrations, client factory
  ui/          Design system primitives and tokens
  tsconfig/    Strict compiler presets
  eslint-config/  Type-aware lint presets
scripts/       setup, rename, module generator, text hygiene check
docs/          Architecture, guides, decision records
```

### Authentication, done properly

| Concern      | Implementation                                                                      |
| ------------ | ----------------------------------------------------------------------------------- |
| Sessions     | Sealed HttpOnly cookie holding only ids, validated against a server-side registry   |
| Lifetimes    | 12h idle sliding sessions, or 30 days with "keep me signed in"                      |
| Revocation   | Logout revokes server-side; password reset revokes every session                    |
| Passwords    | argon2id, constant-time path for unknown accounts                                   |
| Two-factor   | TOTP with QR enrollment, encrypted secrets (AES-256-GCM), single-use recovery codes |
| Email tokens | 256-bit, SHA-256 hashed at rest, single use, expiring                               |
| Abuse        | Redis-backed rate limits on credential and email endpoints, no account enumeration  |

### Quality gates

Every one of these runs in CI and blocks a merge:

| Gate                   | Command              |
| ---------------------- | -------------------- |
| Formatting             | `pnpm format:check`  |
| Text hygiene           | `pnpm check:text`    |
| Monorepo dependencies  | `pnpm check:deps`    |
| Type-checked lint      | `pnpm lint`          |
| Strict type checking   | `pnpm typecheck`     |
| Unused code and deps   | `pnpm check:unused`  |
| Tests with coverage    | `pnpm test:coverage` |
| Generator output valid | CI `generator` job   |
| Docker images build    | CI `docker` job      |
| Security analysis      | CodeQL               |

Coverage thresholds are enforced per workspace: 90% lines, statements, and functions; 85% branches.

## Built for AI agents

Agents write consistent code when the rules are explicit, local, and enforced. Groundwork provides all three.

| Tool           | What it reads                                                               |
| -------------- | --------------------------------------------------------------------------- |
| All agents     | [`AGENTS.md`](AGENTS.md) (canonical) plus one `AGENTS.md` per workspace     |
| Claude Code    | [`CLAUDE.md`](CLAUDE.md), skills, subagents, hooks in [`.claude/`](.claude) |
| Cursor         | Scoped rules in [`.cursor/rules/`](.cursor/rules)                           |
| GitHub Copilot | [`.github/copilot-instructions.md`](.github/copilot-instructions.md)        |
| Gemini CLI     | [`GEMINI.md`](GEMINI.md)                                                    |
| Any LLM        | [`llms.txt`](llms.txt)                                                      |

- **Generator over improvisation.** `pnpm gen module invoice` creates the table, shared contracts, a full API module (list with cursor pagination, create, get with ownership checks), and integration tests. The output passes lint, types, and tests untouched, and CI proves it on every push.
- **Skills** encode the workflows: `new-module`, `add-endpoint`, `db-migration`, `write-tests`, `verify`.
- **Subagents** review changes against the rules: `code-reviewer`, `security-reviewer`.
- **Hooks** format every file an agent writes and reject em dashes and emoji on the spot.
- **Guardrails**: agents cannot read `.env` files, force-push, or `rm -rf`.

## Documentation

- [Getting started](docs/guides/getting-started.md)
- [Architecture overview](docs/architecture/overview.md)
- [Authentication](docs/architecture/authentication.md)
- [Adding a module](docs/guides/adding-a-module.md)
- [API conventions](docs/guides/api-conventions.md)
- [Testing](docs/guides/testing.md)
- [Deployment](docs/guides/deployment.md)
- [Decision records](docs/adr/README.md)

## Related

Groundwork uses two small libraries extracted from production work:

- [`@lepresk/next-bff-fetch`](https://github.com/lepresk/next-bff-fetch): server-only BFF fetch client for the Next.js App Router.
- [`@lepresk/after-commit`](https://github.com/lepresk/after-commit): run side effects only after the database transaction commits.

## License

[MIT](LICENSE) © Lepres Kikounga. Contributions welcome, see [CONTRIBUTING.md](CONTRIBUTING.md).
