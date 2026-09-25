# syntax=docker/dockerfile:1.7
# Web image built from Next.js standalone output (only traced files ship).
ARG NODE_VERSION=24
ARG PNPM_VERSION=11.5.1

FROM node:${NODE_VERSION}-alpine AS build
ARG PNPM_VERSION
RUN npm install --global pnpm@${PNPM_VERSION} && apk add --no-cache libc6-compat
WORKDIR /repo
COPY . .
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --network-concurrency=4 --filter=@groundwork/web...
ENV NEXT_TELEMETRY_DISABLED=1
# API_INTERNAL_URL is read at runtime: one image serves every environment.
RUN pnpm --filter=@groundwork/web... run build

FROM node:${NODE_VERSION}-alpine AS runtime
RUN apk add --no-cache tini
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
WORKDIR /app
COPY --from=build --chown=node:node /repo/apps/web/.next/standalone ./
COPY --from=build --chown=node:node /repo/apps/web/.next/static ./apps/web/.next/static
USER node
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=3s --start-period=20s \
  CMD wget -qO- http://127.0.0.1:3000/login >/dev/null || exit 1
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "apps/web/server.js"]
