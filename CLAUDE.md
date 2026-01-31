# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Monorepo Structure

This is a Turborepo-based monorepo using pnpm workspaces. The project combines Next.js frontends with a NestJS backend, all sharing common configuration packages.

### Apps

- **apps/web**: Next.js application (port 3001)
- **apps/docs**: Next.js documentation site (port 3000)
- **apps/api**: NestJS REST API backend (port 3000 by default, configurable via PORT env var)

### Shared Packages

- **@repo/ui**: Shared React component library with Tailwind CSS
  - Exports both compiled styles (`ui/styles.css`) and TypeScript components
  - Uses `ui-` prefix for Tailwind classes to avoid conflicts
  - Components are consumed directly by Next.js apps via `transpilePackages`
- **@repo/eslint-config**: Shared ESLint configuration
- **@repo/typescript-config**: Shared TypeScript configurations
- **@repo/tailwind-config**: Shared Tailwind/PostCSS configuration

## Common Commands

### Development

```bash
# Run all apps in development mode
pnpm dev

# Run specific app
pnpm --filter web dev        # Next.js web app (port 3001)
pnpm --filter docs dev       # Next.js docs app (port 3000)
pnpm --filter api start:dev  # NestJS API with watch mode

# Run API in debug mode
pnpm --filter api start:debug
```

### Building

```bash
# Build all apps/packages
pnpm build

# Build specific app
pnpm --filter web build
pnpm --filter api build

# Build UI package (styles + components)
pnpm --filter @repo/ui build:styles
pnpm --filter @repo/ui build:components
```

### Linting & Type Checking

```bash
# Lint all packages
pnpm lint

# Type check all packages
pnpm check-types

# Format code
pnpm format
```

### Testing (NestJS API)

```bash
# Run all tests
pnpm --filter api test

# Run tests in watch mode
pnpm --filter api test:watch

# Run tests with coverage
pnpm --filter api test:cov

# Run e2e tests
pnpm --filter api test:e2e

# Debug tests
pnpm --filter api test:debug
```

## Architecture Notes

### Turborepo Task Pipeline

- **build**: Tasks depend on upstream packages being built first (`^build`)
- **dev**: Not cached, runs persistently
- **lint/check-types**: Depend on upstream packages

### Next.js Apps (web/docs)

- Use Next.js 16 App Router architecture
- TypeScript build errors are ignored in config (`ignoreBuildErrors: true`)
- Directly consume `@repo/ui` components via transpilePackages
- Each runs on a different port (web: 3001, docs: 3000)

### NestJS API (apps/api)

- Standard NestJS structure with modules, controllers, and services
- Uses Jest for testing with ts-jest transform
- Test files: `*.spec.ts` (unit) and e2e tests in `/test` directory
- SWC for fast compilation

### UI Package

The `@repo/ui` package uses a hybrid approach:
- Tailwind CSS is compiled separately into `dist/index.css`
- TypeScript components are compiled to `dist/*.js`
- Next.js apps consume components directly from source via transpilePackages
- All UI components use `ui-` prefix for Tailwind classes to prevent conflicts with consuming apps

## Current Project Context

The repository is being extended with an **email inbox system** (see EMAIL_INBOX_PLAN.md). This feature will:
- Add SMTP receiver functionality to accept inbound emails
- Store emails in PostgreSQL (using Prisma or TypeORM)
- Expose REST APIs for inbox management and email retrieval
- Be implemented in `apps/api` as a new NestJS module

## Package Manager

This project uses **pnpm** (version 10.19.0) with workspaces. Always use `pnpm` commands, not npm or yarn.

## Node Version

Requires Node.js >= 18
