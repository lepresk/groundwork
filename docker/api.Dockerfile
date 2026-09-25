# syntax=docker/dockerfile:1.7
# API image. Migrations run as a separate pre-deploy step:
#   docker run --rm <image> node node_modules/@groundwork/db/dist/migrate.js
ARG NODE_VERSION=24
ARG PNPM_VERSION=11.5.1

FROM node:${NODE_VERSION}-alpine AS build
ARG PNPM_VERSION
RUN npm install --global pnpm@${PNPM_VERSION} && apk add --no-cache libc6-compat
WORKDIR /repo
COPY . .
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --network-concurrency=4 --filter=@groundwork/api...
RUN pnpm --filter=@groundwork/api... run build
RUN pnpm --filter=@groundwork/api deploy --prod --legacy /out \
 && cp -r apps/api/dist /out/dist

FROM node:${NODE_VERSION}-alpine AS runtime
RUN apk add --no-cache tini
ENV NODE_ENV=production API_PORT=3001
WORKDIR /app
COPY --from=build --chown=node:node /out ./
USER node
EXPOSE 3001
HEALTHCHECK --interval=15s --timeout=3s --start-period=20s \
  CMD wget -qO- http://127.0.0.1:3001/health/live || exit 1
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "--enable-source-maps", "dist/main.js"]
