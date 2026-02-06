#!/bin/sh
set -e

echo "Installing dependencies..."
pnpm install --frozen-lockfile

echo "Building shared packages..."
# Build UI package (styles and components)
if [ -d "/app/packages/ui" ]; then
  echo "Building @repo/ui..."
  pnpm --filter @repo/ui build:styles
  pnpm --filter @repo/ui build:components
fi

echo "Starting development server..."
exec "$@"
