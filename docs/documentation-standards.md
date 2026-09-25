<!--
SCOPE: rules for writing and maintaining documentation and agent rule files
DOC_KIND: reference
DOC_ROLE: canonical
READ_WHEN: you create, edit, or review a doc or an agent rule file
SKIP_WHEN: you need a project fact rather than a writing rule
PRIMARY_SOURCES: docs/documentation-standards.md, /AGENTS.md
-->

# Documentation standards

## Root model

| File                                 | Role                                                                 |
| ------------------------------------ | -------------------------------------------------------------------- |
| `AGENTS.md` (root)                   | Canonical rules for every agent and human. Change rules here first.  |
| `<workspace>/AGENTS.md`              | Canonical rules scoped to one workspace; extends the root file.      |
| `CLAUDE.md`, `<workspace>/CLAUDE.md` | Derived: import `AGENTS.md` plus Claude Code specifics only.         |
| `GEMINI.md`, `.gemini/settings.json` | Derived: point Gemini CLI at `AGENTS.md`.                            |
| `.github/copilot-instructions.md`    | Derived: short summary that links to `AGENTS.md`.                    |
| `.cursor/rules/*.mdc`                | Derived: glob-scoped excerpts that link to the relevant `AGENTS.md`. |
| `llms.txt`                           | Derived: map of the repository for LLM tools.                        |

Derived files MUST stay thin. Never let a rule exist only in a derived file.

## Header contract

Every doc and agent rule file starts with one HTML comment containing:

| Field             | Meaning                                                                   |
| ----------------- | ------------------------------------------------------------------------- |
| `SCOPE`           | What the document covers, and nothing else                                |
| `DOC_KIND`        | `index`, `reference`, `how-to`, `explanation`, `record`, or `agent-rules` |
| `DOC_ROLE`        | `canonical`, `navigation`, `working`, or `derived`                        |
| `READ_WHEN`       | Trigger to read it                                                        |
| `SKIP_WHEN`       | Trigger to skip it (optional for agent rule files)                        |
| `PRIMARY_SOURCES` | Source-of-truth files for the content                                     |

## Writing rules

| Rule                   | Guidance                                                            |
| ---------------------- | ------------------------------------------------------------------- |
| Map first              | Purpose and routing before details                                  |
| Tables over prose      | Prefer tables, short bullets, and links                             |
| Single source of truth | Link to the canonical doc instead of copying it                     |
| Real commands only     | Every command must exist in `package.json` scripts or the toolchain |
| Link to code           | Reference files by path; keep embedded code short and illustrative  |
| English only           | No em dash (U+2014), no emoji (enforced by `pnpm check:text`)       |
| No placeholders        | Never publish `TBD` or template leftovers                           |

## When to write an ADR

Write an ADR in [`adr/`](adr/README.md) when a decision:

- changes how components talk to each other or where a concern lives;
- picks a technology, library, or protocol that is costly to reverse;
- adds or relaxes a repository-wide rule in `AGENTS.md`.

Format: `NNNN-kebab-title.md` with Status, Context, Decision, Consequences. Superseded ADRs stay in place with `Status: superseded by NNNN`.

## Verification checklist

- [ ] Header contract present
- [ ] Internal links resolve
- [ ] Commands match the current toolchain
- [ ] `pnpm check:text` and `pnpm format:check` pass
