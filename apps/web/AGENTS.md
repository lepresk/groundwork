<!--
SCOPE: apps/web
DOC_KIND: agent-rules
DOC_ROLE: canonical for this folder, extends /AGENTS.md
-->

# apps/web

Next.js 16 App Router acting as a Backend-for-Frontend. The browser only talks to this server; this server talks to the API with `@lepresk/next-bff-fetch`.

## Layout

```
src/
  app/(auth)/        public auth pages
  app/(app)/         signed-in area; layout calls requireUser()
  proxy.ts           optimistic cookie check (the real check is requireUser)
  features/<domain>/
    actions.ts       'use server' mutations: validate with shared schema, callApi, map result
    components/      client components (forms)
  lib/
    api/client.ts    BFF client (server-only)
    api/call.ts      callApi(): typed result, schema-validated, error codes normalized
    errors.ts        user copy for every error code
    session.ts       getCurrentUser() / requireUser()
```

## Rules

- Anything that imports `lib/api/*` or `lib/env.ts` is server-only. Never import them from a `'use client'` file.
- Read data in Server Components with `callApi(path, { schema })`. Mutate in Server Actions. Relay the session cookie (`relaySessionCookie: true`) only on endpoints that issue or clear it.
- Server Actions return `ActionResult` or `redirect()`. Redirect targets from user input go through `safeRedirectPath`.
- Forms use `useActionForm` from `features/auth/use-action-form.ts`.
- Pages use `PageProps<'/route'>` (typed routes). `searchParams` values are `string | string[] | undefined`: narrow them.
- No `NEXT_PUBLIC_` variables for anything sensitive. The API URL is server-only.

## Tests

- Vitest + Testing Library (jsdom). Mock Server Actions at the module boundary in component tests; mock `callApi` in action tests.
- Coverage is measured on `src/lib` and `src/features` with the repository thresholds.
