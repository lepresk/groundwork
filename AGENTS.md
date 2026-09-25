<!--
SCOPE: whole repository
DOC_KIND: agent-rules
DOC_ROLE: canonical
READ_WHEN: before any change in this repository
SKIP_WHEN: never
PRIMARY_SOURCES: this file, then the AGENTS.md of the workspace you touch
-->

# Groundwork: agent rules

This file is the single source of truth for every coding agent (Claude Code, Codex, Cursor, Copilot, Gemini) and for humans. Tool-specific files (`CLAUDE.md`, `GEMINI.md`, `.cursor/rules/`, `.github/copilot-instructions.md`) only point here or scope these rules to a folder. When a rule changes, change it here first.

Rules are written as MUST / MUST NOT. A violation is a defect, not a style choice.

## Quick navigation

| I need to...                 | Go to                                                                                           |
| ---------------------------- | ----------------------------------------------------------------------------------------------- |
| Understand the architecture  | [docs/architecture/overview.md](docs/architecture/overview.md)                                  |
| Add a feature module         | `pnpm gen module <name>`, then [docs/guides/adding-a-module.md](docs/guides/adding-a-module.md) |
| Add an endpoint to a module  | [docs/guides/api-conventions.md](docs/guides/api-conventions.md)                                |
| Write or fix tests           | [docs/guides/testing.md](docs/guides/testing.md)                                                |
| Build a page or form         | [apps/web/AGENTS.md](apps/web/AGENTS.md)                                                        |
| Change the database schema   | [packages/db/AGENTS.md](packages/db/AGENTS.md)                                                  |
| Add a background job         | [apps/worker/AGENTS.md](apps/worker/AGENTS.md)                                                  |
| Know why a decision was made | [docs/adr/](docs/adr/)                                                                          |

## Repository map

```
apps/
  api/        NestJS HTTP API. Business rules, persistence, auth. Private network only.
  worker/     NestJS application context running BullMQ processors (emails, jobs).
  web/        Next.js App Router. BFF: the browser only talks to this server.
packages/
  shared/     Zod contracts shared by all apps: DTOs, error codes, queue payloads.
  db/         Drizzle schema, SQL migrations, database client factory.
  ui/         React design system (Tailwind v4 tokens + primitives).
  tsconfig/   Strictest shared compiler settings.
  eslint-config/  Type-aware lint presets (base, nestjs, nextjs).
scripts/      setup, rename, code generator, text hygiene check.
docs/         Architecture, guides, ADRs.
```

Request flow: `browser -> web (Server Action / Server Component) -> api -> Postgres`, and `api -> Redis queue -> worker -> SMTP`. The session cookie is HttpOnly, issued by the API and relayed by the web server. The API URL is never exposed to the browser.

## Commands

| Command                       | Purpose                                                         |
| ----------------------------- | --------------------------------------------------------------- |
| `pnpm setup`                  | Create `.env` files with generated secrets (first run only)     |
| `pnpm infra:up`               | Start Postgres, Redis, Mailpit (docker compose)                 |
| `pnpm dev`                    | Run api, worker, and web in watch mode                          |
| `pnpm db:generate --name <x>` | Create a SQL migration from schema changes                      |
| `pnpm db:migrate`             | Apply migrations                                                |
| `pnpm gen module <name>`      | Generate a complete, tested feature module                      |
| `pnpm check`                  | Format, text hygiene, dependency lint, lint, types, unused code |
| `pnpm test`                   | All tests (needs `pnpm infra:up`)                               |
| `pnpm verify`                 | `check` + `build` + `test`. The definition of done.             |

Scope a command to one workspace with `pnpm --filter @groundwork/<name> <script>`.

## Workflow for every change

1. **Read before writing.** Open the files you will change and the `AGENTS.md` of that workspace. Follow the existing pattern; do not invent a parallel one.
2. **Plan.** State which files change and why. Prefer the smallest change that fully solves the problem.
3. **Generate, do not hand-write boilerplate.** New feature module: `pnpm gen module <name>`. Then edit the generated files.
4. **Implement with tests.** Every behavior change ships with tests in the same change (see Testing).
5. **Verify.** Run `pnpm verify` (or the filtered equivalent for the workspaces you touched). Paste failures, do not paraphrase them. Never claim success without a green run.

## 1. Language and naming

- All code is in English: identifiers, file names, comments, error codes, API messages, log messages.
- MUST NOT use the em dash character (U+2014) anywhere. Use `-`, `:`, or rephrase. Enforced by `pnpm check:text`.
- MUST NOT use emoji in source code or UI. Enforced by `pnpm check:text`.
- Files: `kebab-case.ts` everywhere, React components included (`login-form.tsx`). Suffix by role: `.controller.ts`, `.action.ts`, `.repository.ts`, `.schemas.ts`, `.mappers.ts`, `.module.ts`, `.test.ts`.
- `PascalCase` types, classes, components. `camelCase` values and functions. `SCREAMING_SNAKE_CASE` for true module-level constants.
- No abbreviations except universal ones (`id`, `url`, `api`, `db`).
- Branches: `<type>/<short-description>`, type in `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `ci`.

## 2. TypeScript

The shared tsconfig enables the strictest options (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noPropertyAccessFromIndexSignature`, ...). MUST NOT be relaxed per workspace.

- MUST NOT use `any`. Use `unknown` and narrow. (lint error)
- MUST NOT use non-null assertions `!`. Handle `null`/`undefined` explicitly. (lint error)
- MUST NOT use `enum`. Use a `const` tuple plus a union type: `export const STATUSES = ['a', 'b'] as const`. (lint error)
- MUST NOT read `process.env` outside `config/env.ts`, `lib/env.ts`, or tool configs. Parse env once with Zod. (lint error)
- MUST validate every boundary with Zod: HTTP input and output, queue payloads, env, third-party responses. Infer types from schemas with `z.infer`.
- Model state and outcomes with discriminated unions, not boolean flags.
- Prefer `satisfies` over `as`. Use `as` only after a runtime check, with a one-line reason.
- Prefer `readonly` for data that is not mutated. Prefer composition over inheritance (framework base classes excepted).
- `switch` over a union MUST be exhaustive. (lint error)

## 3. Comments and documentation

- Every file with non-trivial logic starts with a JSDoc header: what it is for and how to use it.
- Comment the _why_ and the non-obvious (constraints, edge cases, workarounds, security reasons). Never restate the code.
- No conversational comments, no decorative banners, no `TODO` without an issue reference.
- Do not create summary or report Markdown files after a change unless asked. Update existing docs when a convention changes.

## 4. Architecture

- **Keep it simple.** No speculative abstraction, no pattern for its own sake. Three similar lines beat a premature helper; the same logic twice gets extracted.
- **One file, one responsibility.** Named exports only, except where a framework requires a default export (Next.js pages, layouts, configs).
- **Cross-app code lives in packages.** Contracts in `packages/shared`, persistence in `packages/db`, UI in `packages/ui`. An app never imports from another app.
- **Controllers, processors, pages, and Server Actions are thin.** They parse input, call one action or service, and shape the output. No business logic.

### Action pattern (api)

Every command or query with business rules is an action: an `@Injectable()` class with one public `execute()` method.

- Input: already-validated data (the DTO) plus the caller's identity.
- Output: `Result<Value, ErrorCode>` from `@groundwork/shared` for expected failures (`fail('auth.invalid_credentials')`). Throw only for unexpected failures. An action with no expected failure returns the value directly.
- Actions compose repositories and services; repositories never contain business rules.
- The controller turns a failed `Result` into `throw new DomainException(result.error)`.
- Side effects that depend on a write (emails, jobs) are registered with `registerAfterCommitHook` inside `db.transaction()` so they never fire for a rolled-back transaction.

## 5. Database

- Schema lives in `packages/db/src/schema`. Every change goes through a generated migration: `pnpm db:generate --name <descriptive_name>`. Never edit an applied migration.
- Only repositories touch Drizzle. Repository methods take the executor (`db.client` or a transaction) as first argument.
- Every query on user-owned data is scoped by owner. Another user's resource is reported as `not_found`, never `forbidden`.
- Use parameterized queries only (Drizzle builders or `sql` template). Never interpolate into `sql.raw`.
- Timestamps are `timestamptz`. IDs are UUIDs generated by Postgres.

## 6. API design

- Routes are versioned under `/api/v1`. Health probes stay at `/health/live` and `/health/ready`.
- Every endpoint declares request DTOs (from shared Zod schemas) and its response with `@ZodResponse`. Response schemas are `strictObject`, so a leaked field becomes a 500 in tests instead of a silent leak.
- Errors are `{ code, message, meta? }`. `code` is a stable identifier from `ERROR_CODES`; clients pivot on it. Every code has an HTTP status in `apps/api/src/shared/errors/error-catalog.ts` and user copy in `apps/web/src/lib/errors.ts`. Both are `Record<ErrorCode, ...>`, so a missing entry is a compile error.
- Document errors with `@ApiErrors(...codes)`.
- Status codes match semantics: 200, 201, 202, 204, 400, 401, 403, 404, 409, 422, 429, 500, 503. Never "200 with an error field".
- Lists are cursor-paginated (`{ items, nextCursor }`), newest first. Offsets only for small fixed lists.
- Endpoints that could reveal whether an account exists (password reset, resend verification) answer the same way in both cases.
- Credential and email-sending endpoints use `@AuthThrottle()`.

## 7. Testing

- **Minimum coverage** is enforced by Vitest thresholds: 90% lines, statements, and functions, and 85% branches, in every workspace. Below that, the change is incomplete.
- **AAA**: Arrange, Act, Assert, separated by blank lines.
- Cover the happy path, every documented failure, edge cases (empty, boundary, malformed), and weird paths (replay, reuse, concurrency, expired state).
- **Postgres and Redis are never mocked in integration tests.** They run against a dedicated test database (`DATABASE_URL_TEST`). Mocking the database hides constraint, cascade, and index bugs.
- **Mutations are asserted in the database**, never only through the response.
- **Responses are parsed with their shared Zod schema** in every API test.
- External services (SMTP, third-party HTTP) are replaced by recorders or fakes. The BullMQ queue is replaced by a recorder in API tests (`t.emails()`).
- Test names describe behavior: `it('rejects a reused reset token')`.
- A failing test blocks the change. Never skip, delete, or weaken a test to make a change pass.

## 8. Web and UI

- The browser MUST NOT call the API directly. Data loading happens in Server Components through `callApi`; mutations go through Server Actions in `features/<domain>/actions.ts`.
- Server Actions re-validate input with the shared schema. The client is never trusted.
- Forms use `useActionForm` (react-hook-form + Zod): validation on blur, pending state on submit, server field errors mapped onto inputs.
- Every view handles loading, empty, success, and error states. No silent failures: every failure shows a specific, human message from `ERROR_MESSAGES`.
- Destructive or security-lowering actions require an explicit confirmation step.
- Reuse `@groundwork/ui` components. A missing primitive is added there, not inlined in a page. Only semantic design tokens, never raw colors.
- Accessibility: labeled controls, errors linked with `aria-describedby`, keyboard reachable, visible focus.

## 9. Security

- Secrets come from env only, validated at boot. Never log secrets, tokens, cookies, or full request headers (the logger serializers already drop them).
- Passwords: argon2id. Emailed tokens and recovery codes: stored as SHA-256 hashes. TOTP secrets: AES-256-GCM encrypted at rest.
- Sessions are server-side (`auth_sessions`): revocable, idle-expiring, revoked on password reset.
- Never weaken a security control to make a test pass. If a control blocks a legitimate flow, stop and ask.

## 10. Commits and pull requests

- Conventional Commits, enforced by commitlint: `feat(api): add invoice export`. Allowed scopes: `api`, `worker`, `web`, `db`, `shared`, `ui`, `config`, `ci`, `deps`, `deps-dev`, `docs`, `ai`, `repo`.
- Subject in lower case, imperative, no trailing period, 100 characters max.
- One logical change per commit. Never commit `.env` files, secrets, or generated `dist/`.
- AI co-author trailers are stripped by the `commit-msg` hook.
- Pull requests follow `.github/pull_request_template.md`. CI MUST be green before merge.

## Definition of done

- [ ] `pnpm verify` is green (or the filtered equivalent for every workspace touched)
- [ ] New behavior is tested at the right level, mutations checked in the database
- [ ] No new `any`, `!`, `enum`, `process.env`, em dash, or emoji
- [ ] New error codes have a status, an `@ApiErrors` entry, and user copy
- [ ] Schema changes have a migration
- [ ] Docs, ADRs, and these rules updated when a convention changed

## Maintenance

- This file is canonical. Tool-specific files MUST stay thin pointers.
- Keep sections short and imperative. If a rule needs an explanation longer than three lines, move the explanation to `docs/` and link it.
- When a rule is enforced by a tool (lint, tsconfig, check script, CI), say so next to the rule.
