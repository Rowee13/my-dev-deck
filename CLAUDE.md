# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Monorepo Structure

This is a Turborepo-based monorepo using pnpm workspaces. The project combines Next.js frontends with a NestJS backend, all sharing common configuration packages.

### Apps

- **apps/web**: Next.js application (port 4001)
- **apps/docs**: Next.js documentation site (port 4002)
- **apps/api**: NestJS REST API backend (port 4000 by default, configurable via PORT env var)

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
pnpm --filter web dev        # Next.js web app (port 4001)
pnpm --filter docs dev       # Next.js docs app (port 4002)
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
- Each runs on a different port (web: 4001, docs: 4002)

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

## Open Source Project

This is an **open source project** (MIT License) built in public to showcase development capabilities and help the developer community. Key points:

- All development happens transparently on GitHub
- Contributions are welcome - see [CONTRIBUTING.md](./CONTRIBUTING.md)
- Project follows the [Code of Conduct](./CODE_OF_CONDUCT.md)
- Issues and feature requests use GitHub issue templates
- PRs follow the pull request template with required checks

## Docker Development

The project includes Docker setup for local development and production deployment:

```bash
# Start all services (PostgreSQL + API + Web)
docker-compose up

# Start specific service
docker-compose up api
docker-compose up web

# Start with docs (uses profile)
docker-compose --profile full up

# Build images
docker-compose build

# Stop all services
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v
```

**Services:**
- `postgres`: PostgreSQL 16 database on port 5432
- `api`: NestJS backend on ports 4000 (HTTP) and 2525 (SMTP)
- `web`: Next.js dashboard on port 4001
- `docs`: Next.js documentation on port 4002 (optional, use `--profile full`)

All development files are volume-mounted for hot reload.

## CI/CD

GitHub Actions workflow runs on every push and PR to `main`:

- **Lint**: ESLint checks across all packages
- **Type Check**: TypeScript compilation verification
- **Test**: Jest tests for API
- **Build**: Production builds of all apps

See `.github/workflows/ci.yml` for configuration.

## Environment Configuration

Each app has an `.env.example` file showing required environment variables:

- `apps/api/.env.example` - Database, SMTP, API config
- `apps/web/.env.example` - API URL and frontend config
- `apps/docs/.env.example` - Documentation app config

Copy these to `.env` or `.env.local` and customize for your environment.
