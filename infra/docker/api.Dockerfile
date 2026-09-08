# Multi-stage build for the LocaGuide API service.
# Build context MUST be the monorepo root (npm workspaces).

FROM node:20-bookworm-slim AS base
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

FROM base AS deps
COPY package.json package-lock.json* ./
COPY packages/shared/package.json packages/shared/package.json
COPY packages/config/package.json packages/config/package.json
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/providers/package.json packages/providers/package.json
COPY packages/domain/package.json packages/domain/package.json
COPY packages/runtime/package.json packages/runtime/package.json
COPY services/api/package.json services/api/package.json
RUN npm ci

FROM deps AS build
COPY tsconfig.base.json tsconfig.json ./
COPY packages packages
COPY services/api services/api
RUN npx prisma generate --schema packages/db/prisma/schema.prisma
RUN npx tsc -b services/api

FROM base AS runtime
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 locaguide && adduser --system --uid 1001 --gid 1001 locaguide

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages
COPY --from=build /app/services/api/dist ./services/api/dist
COPY --from=build /app/services/api/package.json ./services/api/package.json
COPY --from=build /app/services/api/openapi.yaml ./services/api/openapi.yaml
COPY --from=build /app/services/api/config ./services/api/config
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma

USER locaguide
WORKDIR /app/services/api
EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:4000/livez', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "dist/index.js"]
