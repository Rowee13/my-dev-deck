# Base stage
FROM node:18-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.19.0 --activate
WORKDIR /app

# Dependencies stage
FROM base AS dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/ui/package.json ./packages/ui/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY packages/tailwind-config/package.json ./packages/tailwind-config/
RUN pnpm install --frozen-lockfile

# Development stage
FROM base AS development
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/apps/web/node_modules ./apps/web/node_modules
COPY . .
EXPOSE 3001
CMD ["pnpm", "--filter", "web", "dev"]

# Build stage
FROM base AS build
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN pnpm --filter web build

# Production stage
FROM node:18-alpine AS production
RUN corepack enable && corepack prepare pnpm@10.19.0 --activate
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/apps/web/.next ./.next
COPY --from=build /app/apps/web/public ./public
COPY --from=build /app/apps/web/package.json ./package.json
COPY --from=build /app/apps/web/next.config.ts ./next.config.ts
COPY --from=build /app/node_modules ./node_modules

EXPOSE 3000
CMD ["pnpm", "start"]
