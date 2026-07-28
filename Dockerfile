# Vibra API — production image (monorepo)
FROM node:22-bookworm-slim AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY turbo.json ./
COPY vendor ./vendor
COPY apps/api/package.json ./apps/api/package.json
COPY packages/config/package.json ./packages/config/package.json
COPY packages/types/package.json ./packages/types/package.json
COPY packages/shared/package.json ./packages/shared/package.json
COPY packages/ui/package.json ./packages/ui/package.json
COPY apps/web/package.json ./apps/web/package.json
RUN pnpm install --frozen-lockfile --filter @vibra/api...

FROM base AS build
COPY --from=deps /app /app
COPY packages/config ./packages/config
COPY packages/types ./packages/types
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api
RUN pnpm --filter @vibra/types build \
  && pnpm --filter @vibra/shared build \
  && pnpm --filter @vibra/api prisma:generate \
  && pnpm --filter @vibra/api build

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app

COPY --from=build /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml /app/.npmrc /app/turbo.json ./
COPY --from=build /app/vendor ./vendor
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api ./apps/api
COPY --from=build /app/packages ./packages

EXPOSE 3000

CMD ["sh", "-c", "pnpm --filter @vibra/api exec prisma migrate deploy && node apps/api/dist/main.js"]
