<!--
SCOPE: building images, running migrations, runtime configuration, and probes
DOC_KIND: how-to
DOC_ROLE: canonical
READ_WHEN: you deploy the apps or change a Dockerfile
SKIP_WHEN: you only work locally with `pnpm dev`
PRIMARY_SOURCES: docker/*.Dockerfile, docker-compose.yml, apps/*/src/config/env.ts, apps/web/src/lib/env.ts
-->

# Deployment

## Images

| Image  | Dockerfile                 | Contents                                               | Runs as                               |
| ------ | -------------------------- | ------------------------------------------------------ | ------------------------------------- |
| api    | `docker/api.Dockerfile`    | `dist/` + production `node_modules` from `pnpm deploy` | `node` user, tini as PID 1, port 3001 |
| worker | `docker/worker.Dockerfile` | Same layout                                            | `node` user, health on 3002           |
| web    | `docker/web.Dockerfile`    | Next.js standalone output + static assets              | `node` user, port 3000                |

Build from the repository root: `docker build -f docker/api.Dockerfile -t my-api .`. Every image declares a `HEALTHCHECK` on `/health/live` (web: `/login`).

Try the production images locally: `docker compose --profile apps up --build` (uses your root `.env`).

## Migrations

Run migrations as a pre-deploy step, once per release, before the new api version receives traffic:

`node node_modules/@groundwork/db/dist/migrate.js` (inside the api image, with `DATABASE_URL` set)

Migrations must be backward compatible with the running version (expand, migrate, contract).

## Configuration per service

| Variable                                                                           | api                               | worker                                | web                                        |
| ---------------------------------------------------------------------------------- | --------------------------------- | ------------------------------------- | ------------------------------------------ |
| `NODE_ENV=production`                                                              | set by image                      | set by image                          | set by image                               |
| `DATABASE_URL`                                                                     | required                          |                                       |                                            |
| `REDIS_URL`                                                                        | required                          | required                              |                                            |
| `QUEUE_PREFIX`                                                                     | same value                        | same value                            |                                            |
| `SESSION_SECRET` (32+ chars)                                                       | required                          |                                       |                                            |
| `TWO_FACTOR_ENCRYPTION_KEY` (32 bytes, base64)                                     | required                          |                                       |                                            |
| `WEB_PUBLIC_URL`                                                                   | required (email links)            |                                       |                                            |
| `TRUST_CLIENT_IP_HEADER`                                                           | `true` only if the API is private |                                       |                                            |
| `AUTH_THROTTLE_LIMIT`, `LOG_LEVEL`, `API_PORT`                                     | optional                          |                                       |                                            |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_FROM` |                                   | required (user and password optional) |                                            |
| `WORKER_CONCURRENCY`, `WORKER_HEALTH_PORT`                                         |                                   | optional                              |                                            |
| `API_INTERNAL_URL`                                                                 |                                   |                                       | required, internal URL ending in `/api/v1` |

Every variable is read at runtime, including `API_INTERNAL_URL` for the web app: build one image per service and configure it per environment.

Rotating `SESSION_SECRET` signs everyone out. Rotating `TWO_FACTOR_ENCRYPTION_KEY` without re-encrypting makes stored TOTP secrets unreadable.

## Network

- Expose only the web service publicly. Keep the API on a private network reachable by the web server: the BFF design, CORS-free cookies, and `TRUST_CLIENT_IP_HEADER` all assume it.
- Terminate TLS in front of the web service; cookies are `Secure` in production.

## Probes and scaling

| Service | Liveness            | Readiness                          | Scaling                                                            |
| ------- | ------------------- | ---------------------------------- | ------------------------------------------------------------------ |
| api     | `/health/live`      | `/health/ready` (Postgres + Redis) | Stateless: scale horizontally. Rate limits live in Redis.          |
| worker  | `:3002/health/live` | `:3002/health/ready` (Redis)       | Scale replicas or `WORKER_CONCURRENCY`; jobs must stay idempotent. |
| web     | `/login`            |                                    | Stateless: scale horizontally.                                     |

Swagger is disabled in production. Logs are JSON (pino) on stdout, without headers or cookies.
