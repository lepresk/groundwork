---
name: add-endpoint
description: Add an endpoint or use case to an existing API module following the action pattern. Use when the user asks for a new route, operation, or business rule on an existing resource.
---

# Add an endpoint

1. Read the module folder (`apps/api/src/modules/<feature>/`) and its integration test first.
2. **Contract** in `packages/shared/src/<feature>.ts`: request schema (normalizing input) and response `strictObject`. Rebuild shared.
3. **Error codes**: add each expected failure to `ERROR_CODES`, then its status in `apps/api/src/shared/errors/error-catalog.ts` and copy in `apps/web/src/lib/errors.ts`.
4. **Repository**: add the query, executor first, owner-scoped.
5. **Action** in `actions/<verb>-<noun>.action.ts`: `@Injectable()`, one `execute()`, returns `Result<T, ErrorCode>` with `ok()` / `fail()`. Wrap multi-statement writes in `db.transaction()`; register side effects with `registerAfterCommitHook`.
6. **Controller**: DTO from the shared schema, `@ZodResponse({ status, type })`, `@ApiErrors(...)`, and `throw new DomainException(result.error)` on failure. Register the action in the module `providers`.
7. **Tests** in `apps/api/test/integration/<feature>.test.ts`: happy path, each error code, ownership, validation, and a database assertion for every mutation. Parse responses with the shared schema.
8. Run the `verify` skill for `@groundwork/shared` and `@groundwork/api` (and `@groundwork/web` if copy changed).
