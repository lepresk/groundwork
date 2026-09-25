<!--
SCOPE: decision record: 0003. Server-side sessions instead of JWT
DOC_KIND: record
DOC_ROLE: canonical
READ_WHEN: you need the rationale behind this decision or plan to change it
SKIP_WHEN: you only need the current convention
PRIMARY_SOURCES: /AGENTS.md
-->

# 0003. Server-side sessions instead of JWT

- **Status:** accepted

## Context

Stateless JWTs cannot be revoked before expiry without a denylist, which reintroduces server state. Password resets and "sign out everywhere" must take effect immediately.

## Decision

A sealed iron-session cookie carries only identifiers. Validity lives in the `auth_sessions` table: idle expiry (12 h sliding), remember-me lifetime (30 d), and `revokedAt`. Every authenticated request checks the row.

## Consequences

- Immediate revocation (logout, password reset) and an audit trail of sessions with IP and user agent.
- One indexed query per authenticated request, plus at most one activity write per minute.
- Scaling the API needs no sticky sessions: the state is in Postgres.
