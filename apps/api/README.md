# API Backend

NestJS backend API for My Dev Deck providing REST endpoints and SMTP server functionality.

## Overview

This backend serves as the core service layer for all My Dev Deck tools. It handles data persistence, business logic, and integrations like SMTP email reception for DevInbox.

## Tech Stack

- **Framework:** NestJS 11
- **Database:** PostgreSQL + Prisma ORM
- **Runtime:** Node.js 18+
- **Testing:** Jest
- **TypeScript:** 5.7.3

## Development

```bash
# Run in development mode with watch
pnpm --filter api start:dev

# Run in debug mode
pnpm --filter api start:debug

# Build for production
pnpm --filter api build

# Start production build
pnpm --filter api start:prod

# Run tests
pnpm --filter api test

# Run tests in watch mode
pnpm --filter api test:watch

# Run tests with coverage
pnpm --filter api test:cov

# Run e2e tests
pnpm --filter api test:e2e
```

The API server runs on **http://localhost:3000**

## Structure

```
apps/api/
├── src/
│   ├── main.ts           # Application entry point
│   ├── app.module.ts     # Root module
│   ├── app.controller.ts # Root controller
│   └── app.service.ts    # Root service
├── test/                 # E2E tests
├── prisma/              # Database schema (to be added)
└── package.json         # Dependencies
```

## Environment Variables

Create `.env` based on `.env.example`:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/devdeck
PORT=3000
NODE_ENV=development
SMTP_PORT=2525
SMTP_DOMAIN=devinbox.local
```

## API Endpoints

### Health Check
- `GET /` - API status

### DevInbox (Planned)
- `POST /api/projects` - Create project
- `GET /api/projects` - List projects
- `GET /api/projects/:id/emails` - List emails
- `GET /api/projects/:id/emails/:emailId` - Get email details

## SMTP Server

The API includes an embedded SMTP server (port 2525) for receiving emails in DevInbox. It parses incoming emails and stores them in the database.

## Database

Uses PostgreSQL with Prisma ORM. Migrations and schema will be added during DevInbox implementation.

## Related

- Frontend: `apps/web` - Dashboard UI
- Docs: See root README for overall architecture
