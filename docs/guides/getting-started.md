<!--
SCOPE: first run of the repository on a development machine
DOC_KIND: how-to
DOC_ROLE: canonical
READ_WHEN: you clone or fork the repository, or your local setup is broken
SKIP_WHEN: your environment already runs `pnpm dev` and `pnpm test`
PRIMARY_SOURCES: package.json, scripts/setup.mjs, docker-compose.yml, .env.example
-->

# Getting started

## Prerequisites

| Tool    | Version                                         | Note                                               |
| ------- | ----------------------------------------------- | -------------------------------------------------- |
| Node.js | 24 (see `.nvmrc`)                               | `engineStrict` is on: other majors fail at install |
| pnpm    | 11 (see `packageManager`)                       | `npm install --global pnpm@11` or Corepack         |
| Docker  | Recent Docker Desktop or Engine with Compose v2 | Runs Postgres, Redis, Mailpit                      |

## First run

| Step | Command           | What it does                                                                                         |
| ---- | ----------------- | ---------------------------------------------------------------------------------------------------- |
| 1    | `pnpm install`    | Installs dependencies, sets up git hooks                                                             |
| 2    | `pnpm setup`      | Creates `.env` and `apps/web/.env.local`, generates `SESSION_SECRET` and `TWO_FACTOR_ENCRYPTION_KEY` |
| 3    | `pnpm infra:up`   | Starts Postgres (with a `groundwork_test` database), Redis, Mailpit and waits for health             |
| 4    | `pnpm build`      | Builds every workspace (needed once for `packages/db` and `packages/shared`)                         |
| 5    | `pnpm db:migrate` | Applies migrations to the dev database                                                               |
| 6    | `pnpm dev`        | Runs api, worker, web, and package watchers                                                          |

## Local URLs

| What                               | URL                                |
| ---------------------------------- | ---------------------------------- |
| Web app                            | http://localhost:3000              |
| API OpenAPI UI                     | http://localhost:3001/api/v1/docs  |
| API readiness                      | http://localhost:3001/health/ready |
| Worker readiness                   | http://localhost:3002/health/ready |
| Mailpit (every email sent locally) | http://localhost:8025              |

## Starting your own project from the template

1. Create a repository from the template and clone it.
2. `pnpm rename <your-name> --title "Your Name"` rewrites the npm scope, cookie, queue, database, and titles (`--dry-run` to preview).
3. `pnpm install`, then continue with the first run above.
4. Update `.github/CODEOWNERS` and the `LICENSE` holder.

## Troubleshooting

| Symptom                                        | Fix                                                                                                                                     |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `port is already allocated` on `pnpm infra:up` | Set `POSTGRES_PORT`, `REDIS_PORT`, or `MAILPIT_UI_PORT` in `.env` and update `DATABASE_URL`, `DATABASE_URL_TEST`, `REDIS_URL` to match. |
| `ERR_PNPM_UNSUPPORTED_ENGINE`                  | Use Node 24: `nvm use`.                                                                                                                 |
| `Invalid environment configuration` at boot    | The message lists the invalid variables; compare with `.env.example`.                                                                   |
| `DATABASE_URL_TEST is required` in tests       | Add it to `.env` (created by `pnpm setup`).                                                                                             |
| Emails never arrive in Mailpit                 | The worker must run (`pnpm dev` starts it) and `QUEUE_PREFIX` must match between api and worker.                                        |
| `Cannot find module '@groundwork/shared'`      | Build packages: `pnpm build` or keep `pnpm dev` running.                                                                                |
| `ERR_PNPM_NO_MATURE_MATCHING_VERSION`          | `minimumReleaseAge` blocks versions younger than 24 hours; pick an older version or wait.                                               |
