<!--
SCOPE: whole repository
DOC_KIND: agent-rules
DOC_ROLE: derived (Claude Code entry point)
READ_WHEN: always, loaded automatically by Claude Code
-->

# Claude Code

@AGENTS.md

## Claude Code specifics

- **Skills** (`.claude/skills/`): `new-module`, `add-endpoint`, `db-migration`, `write-tests`, `verify`. Use them instead of improvising the workflow they describe.
- **Subagents** (`.claude/agents/`): `code-reviewer` for a rules-based review of a diff, `security-reviewer` for auth, input, and data exposure concerns. Run `code-reviewer` before declaring a non-trivial change done.
- **Hooks** (`.claude/settings.json`): every file you write is formatted with Prettier and checked for em dashes and emoji. A hook failure means the file violates a rule: fix it, do not work around it.
- **Permissions**: reading `.env` files is denied on purpose. Configuration shape lives in `.env.example` and `*/config/env.ts`.
- **MCP** (`.mcp.json`): `context7` serves current library documentation. Query it before using an API you are not certain about (NestJS 11, Next.js 16, Zod 4, Drizzle, BullMQ).
- Each workspace has its own `CLAUDE.md` that imports its `AGENTS.md`; it loads when you work in that folder.
