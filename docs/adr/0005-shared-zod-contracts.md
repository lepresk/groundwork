<!--
SCOPE: decision record: 0005. Zod contracts in a shared package
DOC_KIND: record
DOC_ROLE: canonical
READ_WHEN: you need the rationale behind this decision or plan to change it
SKIP_WHEN: you only need the current convention
PRIMARY_SOURCES: /AGENTS.md
-->

# 0005. Zod contracts in a shared package

- **Status:** accepted

## Context

Request, response, error, and queue payload shapes are used by the API, the worker, and the web app. Duplicated type definitions drift silently.

## Decision

All contracts are Zod schemas in `packages/shared`. The API derives DTOs with `nestjs-zod` (`createZodDto`) for validation, serialization (`@ZodResponse`), and OpenAPI. The web app validates forms and Server Action inputs and parses API responses with the same schemas. Response schemas are strict.

## Consequences

- One definition per shape, runtime-checked at every boundary, with inferred TypeScript types.
- An undeclared response field fails in tests instead of leaking.
- Union schemas cannot be DTO classes; request DTOs stay object schemas (with refinements when needed).
