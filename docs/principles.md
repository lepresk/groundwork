<!--
SCOPE: engineering principles, decision order, and anti-patterns
DOC_KIND: explanation
DOC_ROLE: canonical
READ_WHEN: you must choose between alternatives or justify a tradeoff
SKIP_WHEN: you need a concrete convention (see AGENTS.md or docs/guides)
PRIMARY_SOURCES: docs/principles.md, /AGENTS.md
-->

# Engineering principles

## Core principles

| #   | Principle                | In practice                                                                                                                         |
| --- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Standards first          | Prefer the platform and framework standard (RFC 6238 TOTP, argon2id, HTTP semantics, Conventional Commits) over a custom invention. |
| 2   | YAGNI                    | Build what the current requirement needs. The template ships auth and nothing else on purpose.                                      |
| 3   | KISS                     | The simplest correct solution wins. Three similar lines beat a premature helper.                                                    |
| 4   | DRY                      | One source of truth per concept: Zod contracts in `packages/shared`, schema in `packages/db`, rules in `AGENTS.md`.                 |
| 5   | Consumer-first contracts | Design request, response, and error shapes from the caller's side. Stable error codes, strict response schemas, cursor pages.       |
| 6   | Security by design       | Security is a design input: server-side sessions, hashed tokens, encrypted secrets, owner-scoped queries, private API.              |
| 7   | Docs as code             | Docs and agent rules change in the same pull request as the code they describe.                                                     |
| 8   | Boring technology        | Postgres, Redis, SMTP, HTTP cookies. Spend novelty budget on the product, not the plumbing.                                         |
| 9   | No legacy                | Remove dead compatibility layers and unused code quickly (`pnpm check:unused` enforces it).                                         |

## Decision order

When principles conflict, the higher item wins.

1. Security
2. Correctness
3. Standards compliance
4. Simplicity
5. Necessity
6. Maintainability
7. Performance

## Anti-patterns

| Anti-pattern                                              | Instead                                                    |
| --------------------------------------------------------- | ---------------------------------------------------------- |
| Business logic in controllers, pages, or processors       | Put it in an action; keep entry points thin                |
| Throwing for expected failures                            | Return `fail(code)` from the action                        |
| Mocking the database in integration tests                 | Run against the test database                              |
| Asserting only the HTTP response after a write            | Query the rows and assert the persisted state              |
| Magic strings and numbers scattered in code               | Named constants, `const` tuples, the error catalog         |
| Silent failures                                           | Every failure has a code, a message, and a visible outcome |
| Side effects inside a transaction that may roll back      | `registerAfterCommitHook`                                  |
| Speculative abstraction and generic "managers"            | Solve the concrete case; extract on the second use         |
| Leaky abstractions (Drizzle in actions, `fetch` in pages) | Repositories and `callApi`                                 |

## Verification checklist

- [ ] The simplest correct option was chosen, and the reason is stated when not obvious
- [ ] No duplicated knowledge: contracts, rules, and copy each have one home
- [ ] Security implications checked (ownership, enumeration, exposure, throttling)
- [ ] Docs and agent rules updated with the change
