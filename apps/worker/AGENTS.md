<!--
SCOPE: apps/worker
DOC_KIND: agent-rules
DOC_ROLE: canonical for this folder, extends /AGENTS.md
-->

# apps/worker

NestJS application context (no HTTP API) running BullMQ processors. It exposes only `/health/live` and `/health/ready` on `WORKER_HEALTH_PORT`.

## Adding a job

1. Define the payload schema and queue name in `packages/shared/src/queues.ts`.
2. Add a typed producer in `apps/api/src/shared/queue/` and register the queue in `QueueModule`.
3. Add a `@Processor(queueName)` class here, register the queue and the processor in `worker.module.ts`.
4. In `process()`: parse the payload with the shared schema. A malformed payload throws `UnrecoverableError` (no retry). Transient failures are rethrown so BullMQ retries with backoff.

## Rules

- Processors are idempotent: a job can run more than once.
- External systems sit behind a port (see `mail/mail-transport.ts`) so tests inject a recorder.
- Email templates escape every interpolated value with `escapeHtml` and ship a plain-text body.
- `QUEUE_PREFIX` must match the API. Tests use a random prefix per run.
