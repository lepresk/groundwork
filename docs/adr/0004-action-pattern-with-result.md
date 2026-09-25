<!--
SCOPE: decision record: 0004. Action pattern returning Result types
DOC_KIND: record
DOC_ROLE: canonical
READ_WHEN: you need the rationale behind this decision or plan to change it
SKIP_WHEN: you only need the current convention
PRIMARY_SOURCES: /AGENTS.md
-->

# 0004. Action pattern returning Result types

- **Status:** accepted

## Context

Business logic spread across controllers and services is hard to find, test, and reuse. Exceptions used for expected outcomes (wrong password, not found) hide the failure modes from type signatures.

## Decision

Each use case is an injectable action with one `execute()` method. Expected failures are values: `Result<Value, ErrorCode>` built with `ok()` and `fail()`. Controllers stay thin and convert a failure into `DomainException`. Unexpected failures still throw.

## Consequences

- The signature documents every expected failure code; the compiler checks callers handle them.
- Actions are testable through HTTP and in isolation with constructor mocks.
- Some ceremony for trivial reads; an action without expected failures returns its value directly.
