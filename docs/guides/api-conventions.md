<!--
SCOPE: conventions for API endpoints, errors, pagination, transactions, and throttling
DOC_KIND: reference
DOC_ROLE: canonical
READ_WHEN: you add or change an endpoint or an action
SKIP_WHEN: your change is web-only or infrastructure-only
PRIMARY_SOURCES: apps/api/src, packages/shared/src
-->

# API conventions

## Routes

| Rule         | Detail                                                                                                                                 |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| Prefix       | `/api/v1` for everything except `/health/live` and `/health/ready`                                                                     |
| Naming       | Plural kebab-case resources: `/invoices`, `/invoices/:id`; sub-actions as nouns or verbs under the resource: `/auth/two-factor/enable` |
| Auth         | `@Authenticated()` on the controller or route, caller via `@CurrentSession()`                                                          |
| Status codes | 200 read, 201 create, 202 accepted async work, 204 no body, 4xx/5xx from the error catalog                                             |

## Contracts

- Request and response schemas live in `packages/shared`. The API wraps them with `createZodDto`.
- The global `ZodValidationPipe` validates bodies, queries, and params. Request objects are `strictObject`, so unknown fields are a 400.
- Declare every response with `@ZodResponse({ status, type })`. The global `ZodSerializerInterceptor` re-validates the returned value; an undeclared field becomes a 500 and is logged.
- Union responses (for example `LoginResponseDto`) are DTO values, not classes; request DTOs must be classes so validation metadata exists.

## Errors

| Piece                                       | Location                                                                                                         |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Code registry `ERROR_CODES`                 | `packages/shared/src/errors.ts`                                                                                  |
| Status and default English message per code | `apps/api/src/shared/errors/error-catalog.ts` (`Record<ErrorCode, ...>`)                                         |
| User copy per code                          | `apps/web/src/lib/errors.ts` (`Record<ErrorCode, string>`)                                                       |
| Rendering                                   | `DomainExceptionFilter`: `{ code, message, meta? }`; validation issues as `meta.issues[{ path, code, message }]` |
| OpenAPI                                     | `@ApiErrors('code', ...)` on the route                                                                           |

## Actions and Result

```ts
@Injectable()
export class GetInvoiceAction {
  constructor(
    private readonly db: DbService,
    private readonly invoices: InvoicesRepository,
  ) {}

  async execute(ownerId: string, id: string): Promise<Result<Invoice, 'invoice.not_found'>> {
    const row = await this.invoices.findOwned(this.db.client, ownerId, id);
    return row === null ? fail('invoice.not_found') : ok(toInvoice(row));
  }
}

// controller
const result = await this.getAction.execute(session.userId, params.id);
if (!result.ok) throw new DomainException(result.error);
return result.value;
```

## Pagination

Time-ordered lists use keyset cursors from `apps/api/src/shared/pagination/cursor.ts`:

| Helper                           | Role                                                                      |
| -------------------------------- | ------------------------------------------------------------------------- |
| `CursorPageQuerySchema` (shared) | `cursor?`, `limit` (default 20, max 100)                                  |
| `afterCursor`, `newestFirst`     | `WHERE (created_at, id) < cursor` and `ORDER BY created_at DESC, id DESC` |
| `toPage(rows, limit)`            | Query `limit + 1` rows; returns `{ items, nextCursor }`                   |
| `decodeCursor`                   | Returns `null` for a malformed cursor: answer `generic.bad_request`       |

## Transactions and side effects

`DbService.transaction(cb)` runs the callback in a Postgres transaction inside an after-commit context (`@lepresk/after-commit`). Code anywhere below it calls `registerAfterCommitHook(() => queue.enqueue(...))`; hooks run only after commit and are dropped on rollback. Outside a transaction the hook runs immediately.

## Throttling

| Budget                                  | Scope                                               |
| --------------------------------------- | --------------------------------------------------- |
| 300 requests / minute                   | Global default, per client IP                       |
| `AUTH_THROTTLE_LIMIT` (10) / 15 minutes | `@AuthThrottle()` on credential and email endpoints |
| None                                    | `@SkipThrottle()` on health probes                  |

Storage is Redis in dev and production, in-memory in tests.

## OpenAPI

Swagger UI at `/api/v1/docs` and JSON at `/api/v1/docs-json`, generated from the Zod DTOs (`cleanupOpenApiDoc`). Disabled when `NODE_ENV=production`. A test asserts the document builds and lists auth routes with their error responses.
