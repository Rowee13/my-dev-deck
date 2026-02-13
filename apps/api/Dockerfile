# Base stage
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.19.0 --activate
WORKDIR /app

# Dependencies stage - install all dependencies for the monorepo
FROM base AS dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/typescript-config/package.json ./packages/typescript-config/
RUN pnpm install --frozen-lockfile

# Build stage - build the API
FROM base AS build
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN pnpm install --frozen-lockfile
# Generate Prisma client with dummy DATABASE_URL (only needed for generation, not actual connection)
RUN cd apps/api && DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate
# Build the NestJS application
RUN cd apps/api && npx nest build

# Production stage - copy entire build directory
FROM node:20-alpine AS production
RUN corepack enable && corepack prepare pnpm@10.19.0 --activate
ENV NODE_ENV=production

# Copy the ENTIRE /app directory from build (everything works there)
COPY --from=build /app /app

# Set working directory to where the API is
WORKDIR /app/apps/api

EXPOSE 3000 2525
CMD ["node", "dist/src/main.js"]
