<!--
SCOPE: packages/ui
DOC_KIND: agent-rules
DOC_ROLE: canonical for this folder, extends /AGENTS.md
-->

# packages/ui

React 19 primitives styled with Tailwind v4, consumed as source by the web app (`transpilePackages`).

- Style only with semantic tokens from `src/styles.css` (`bg-primary`, `text-muted-foreground`, ...). No raw palette colors.
- Components accept `className` and merge it with `cn()` so callers can override.
- Variants use `class-variance-authority`. Interactive components expose a `pending` or `disabled` state.
- Accessibility is part of the contract: labels, roles, `aria-*` wiring. Test it with Testing Library queries by role and label.
- Imports inside this package are extensionless (bundler resolution).
