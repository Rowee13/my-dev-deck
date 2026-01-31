# Base stage
FROM node:18-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.19.0 --activate
WORKDIR /app

# Dependencies stage
FROM base AS dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/typescript-config/package.json ./packages/typescript-config/
RUN pnpm install --frozen-lockfile

# Development stage
FROM base AS development
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/apps/api/node_modules ./apps/api/node_modules
COPY . .
EXPOSE 3000 2525
CMD ["pnpm", "--filter", "api", "start:dev"]

# Build stage
FROM base AS build
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN pnpm --filter api build

# Production stage
FROM node:18-alpine AS production
RUN corepack enable && corepack prepare pnpm@10.19.0 --activate
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules

EXPOSE 3000 2525
CMD ["node", "dist/main.js"]
