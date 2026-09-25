<!--
SCOPE: documentation map of the repository
DOC_KIND: index
DOC_ROLE: navigation
READ_WHEN: you need to find the doc that covers a topic
SKIP_WHEN: you already know which doc to open
PRIMARY_SOURCES: /AGENTS.md, docs/documentation-standards.md
-->

# Documentation

Rules for agents and humans live in [`/AGENTS.md`](../AGENTS.md). This folder explains the why and the how.

| Topic                                       | Doc                                                              | Kind        |
| ------------------------------------------- | ---------------------------------------------------------------- | ----------- |
| Engineering principles and decision order   | [principles.md](principles.md)                                   | explanation |
| How docs in this repo are written           | [documentation-standards.md](documentation-standards.md)         | reference   |
| Components, request flow, ports, config     | [architecture/overview.md](architecture/overview.md)             | explanation |
| Sessions, 2FA, tokens, crypto choices       | [architecture/authentication.md](architecture/authentication.md) | explanation |
| First run on a new machine                  | [guides/getting-started.md](guides/getting-started.md)           | how-to      |
| Add a feature module (api + web)            | [guides/adding-a-module.md](guides/adding-a-module.md)           | how-to      |
| Endpoints, errors, pagination, transactions | [guides/api-conventions.md](guides/api-conventions.md)           | reference   |
| Test levels, harness, coverage, CI          | [guides/testing.md](guides/testing.md)                           | reference   |
| Docker images, migrations, env, probes      | [guides/deployment.md](guides/deployment.md)                     | how-to      |
| Architecture decision records               | [adr/README.md](adr/README.md)                                   | record      |
