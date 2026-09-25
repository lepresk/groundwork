<!--
SCOPE: decision record: 0002. Next.js server as a Backend-for-Frontend
DOC_KIND: record
DOC_ROLE: canonical
READ_WHEN: you need the rationale behind this decision or plan to change it
SKIP_WHEN: you only need the current convention
PRIMARY_SOURCES: /AGENTS.md
-->

# 0002. Next.js server as a Backend-for-Frontend

- **Status:** accepted

## Context

A browser calling the API directly needs CORS, exposes the API surface and URL, and tempts storing tokens in JavaScript-readable storage.

## Decision

The browser talks only to the Next.js server. Server Components read and Server Actions mutate through `callApi`, built on `@lepresk/next-bff-fetch`, which forwards the session cookie and client metadata and relays `Set-Cookie` back. The API runs on a private network.

## Consequences

- No CORS, no token in the browser, the session cookie stays HttpOnly.
- Every browser-facing mutation is a Server Action that re-validates its input.
- The API must trust forwarded client IPs only when it is private (`TRUST_CLIENT_IP_HEADER`).
- One extra network hop per request, negligible on a private network.
