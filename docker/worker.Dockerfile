# syntax=docker/dockerfile:1.7
# Worker image: no public port, health endpoint on WORKER_HEALTH_PORT.
ARG NODE_VERSION=24
ARG PNPM_VERSION=11.5.1

FROM node:${NODE_VERSION}-alpine AS build
ARG PNPM_VERSION
RUN npm install --global pnpm@${PNPM_VERSION} && apk add --no-cache libc6-compat
WORKDIR /repo
COPY . .
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --network-concurrency=4 --filter=@groundwork/worker...
RUN pnpm --filter=@groundwork/worker... run build
RUN pnpm --filter=@groundwork/worker deploy --prod --legacy /out \
 && cp -r apps/worker/dist /out/dist

FROM node:${NODE_VERSION}-alpine AS runtime
RUN apk add --no-cache tini
ENV NODE_ENV=production WORKER_HEALTH_PORT=3002
WORKDIR /app
COPY --from=build --chown=node:node /out ./
USER node
HEALTHCHECK --interval=15s --timeout=3s --start-period=20s \
  CMD wget -qO- http://127.0.0.1:3002/health/live || exit 1
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "--enable-source-maps", "dist/main.js"]
