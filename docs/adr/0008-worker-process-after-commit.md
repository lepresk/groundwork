<!--
SCOPE: decision record: 0008. Separate worker process with after-commit enqueueing
DOC_KIND: record
DOC_ROLE: canonical
READ_WHEN: you need the rationale behind this decision or plan to change it
SKIP_WHEN: you only need the current convention
PRIMARY_SOURCES: /AGENTS.md
-->

# 0008. Separate worker process with after-commit enqueueing

- **Status:** accepted

## Context

Sending email or calling third parties inside a request adds latency and failure modes, and enqueueing inside a transaction can publish work for data that is later rolled back.

## Decision

A separate NestJS application context (`apps/worker`) consumes BullMQ queues. Producers in the API validate payloads against shared schemas and enqueue from `registerAfterCommitHook` (`@lepresk/after-commit`), which `DbService.transaction` activates. Consumers re-validate payloads; malformed jobs fail without retry, transient errors retry with exponential backoff.

## Consequences

- Requests stay fast, and a rollback never sends an email.
- The worker scales and deploys independently and exposes its own health probes.
- Jobs must be idempotent: a job can run more than once.
