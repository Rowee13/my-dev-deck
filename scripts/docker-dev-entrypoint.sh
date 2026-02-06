#!/bin/sh
set -e

echo "Installing dependencies..."
# Use --no-frozen-lockfile in development to allow dependency updates
pnpm install --no-frozen-lockfile

echo "Generating Prisma Client..."
# Generate Prisma Client for API
if [ -d "/app/apps/api/prisma" ]; then
  cd /app/apps/api && pnpm exec prisma generate && cd /app
fi

echo "Running database migrations..."
# Run Prisma migrations for API
if [ -d "/app/apps/api/prisma" ]; then
  cd /app/apps/api && pnpm exec prisma migrate deploy && cd /app
fi

echo "Building shared packages..."
# Build UI package (styles and components)
if [ -d "/app/packages/ui" ]; then
  echo "Building @repo/ui..."
  pnpm --filter @repo/ui build:styles
  pnpm --filter @repo/ui build:components
fi

echo "Starting development server..."
exec "$@"
