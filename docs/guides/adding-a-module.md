<!--
SCOPE: creating a new feature module with the generator and wiring it into the web app
DOC_KIND: how-to
DOC_ROLE: canonical
READ_WHEN: you add a new resource or feature area
SKIP_WHEN: you add an endpoint to an existing module (see api-conventions.md)
PRIMARY_SOURCES: scripts/gen/index.mjs, scripts/gen/templates.mjs
-->

# Adding a module

## 1. Generate

```bash
pnpm gen module invoice            # singular kebab-case
pnpm gen module person --plural people
pnpm gen module invoice --dry-run  # preview only
```

The generator refuses to overwrite existing files and fails if a `gen:` marker is missing.

## 2. What you get

| File                                                | Purpose                                                                                        |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `packages/db/src/schema/invoices.ts`                | Table with `id`, `ownerId` (FK to users, cascade), placeholder `name`, timestamps, owner index |
| `packages/shared/src/invoices.ts`                   | `InvoiceSchema`, `CreateInvoiceRequestSchema`, `InvoiceListResponseSchema`                     |
| `apps/api/src/modules/invoices/invoices.schemas.ts` | DTOs, list query, id params                                                                    |
| `.../invoices.repository.ts`                        | Owner-scoped create, find, and cursor list                                                     |
| `.../invoices.mappers.ts`                           | Row to response                                                                                |
| `.../actions/create-invoice.action.ts`              | Create (no expected failure, returns the value)                                                |
| `.../actions/get-invoice.action.ts`                 | Get, `fail('invoice.not_found')` for missing or foreign rows                                   |
| `.../actions/list-invoices.action.ts`               | Cursor list, `fail('generic.bad_request')` for a malformed cursor                              |
| `.../invoices.controller.ts`                        | `GET /invoices`, `POST /invoices`, `GET /invoices/:id`, all `@Authenticated()`                 |
| `.../invoices.module.ts`                            | Nest module                                                                                    |
| `apps/api/test/integration/invoices.test.ts`        | Create, validation, pagination, bad cursor, ownership, auth                                    |

It also inserts, at the `gen:` markers: the schema and contract exports, the `invoice.not_found` error code with its status and web copy, and the module in `app.module.ts`.

## 3. Finish the backend

| Step                             | Command                                                          |
| -------------------------------- | ---------------------------------------------------------------- |
| Build contracts                  | `pnpm --filter @groundwork/db --filter @groundwork/shared build` |
| Replace `name` with real columns | Edit schema, contracts, mapper, repository input, tests together |
| Create the migration             | `pnpm db:generate --name add_invoices` then review the SQL       |
| Apply it                         | `pnpm db:migrate`                                                |
| Verify                           | `pnpm format && pnpm --filter @groundwork/api test`              |

CI generates a sample module on every pull request and runs its tests, so the templates cannot rot.

## 4. Add a web page

Read in a Server Component, with the shared schema:

```tsx
// apps/web/src/app/(app)/invoices/page.tsx
import { InvoiceListResponseSchema } from '@groundwork/shared';
import { callApi } from '@/lib/api/call';
import { errorMessage } from '@/lib/errors';

export default async function InvoicesPage() {
  const result = await callApi('/invoices', { schema: InvoiceListResponseSchema });
  if (!result.ok) {
    return <p role="alert">{errorMessage(result.code)}</p>;
  }
  // render result.data.items, with an empty state when the list is empty
}
```

Mutate in a Server Action that re-validates input:

```ts
// apps/web/src/features/invoices/actions.ts
'use server';
export async function createInvoiceAction(input: unknown): Promise<ActionResult> {
  const parsed = CreateInvoiceRequestSchema.safeParse(input);
  if (!parsed.success) return invalidInput(fieldErrorsFromZod(parsed.error));
  const result = await callApi('/invoices', {
    method: 'POST',
    body: parsed.data,
    schema: InvoiceSchema,
  });
  if (!result.ok) return actionFailure(result);
  revalidatePath('/invoices');
  return { ok: true, data: null };
}
```

Bind the form with `useActionForm({ schema: CreateInvoiceRequestSchema, defaultValues, action: createInvoiceAction })` and render fields with `FormField` from `@groundwork/ui`. Add the route prefix to `PROTECTED_PREFIXES` in `src/proxy.ts` if it lives outside `/dashboard` and `/settings`.
