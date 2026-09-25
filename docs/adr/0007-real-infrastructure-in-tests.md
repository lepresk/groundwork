<!--
SCOPE: decision record: 0007. Integration tests on real Postgres and Redis
DOC_KIND: record
DOC_ROLE: canonical
READ_WHEN: you need the rationale behind this decision or plan to change it
SKIP_WHEN: you only need the current convention
PRIMARY_SOURCES: /AGENTS.md
-->

# 0007. Integration tests on real Postgres and Redis

- **Status:** accepted

## Context

Mocked databases pass tests that fail in production: unique constraints, cascades, defaults, indexes, and transaction behavior are invisible to mocks.

## Decision

API integration tests boot the real application against a dedicated test database and Redis. Only boundaries to external systems are replaced (the BullMQ queue by a recorder, SMTP by a fake transport). Mutations are asserted by querying the database; responses are parsed with their schemas.

## Consequences

- Tests catch constraint and query bugs, and document real behavior.
- Local runs need `pnpm infra:up`; CI runs Postgres and Redis as services.
- Test files run serially and truncate tables between tests: slower than unit tests, still seconds.
