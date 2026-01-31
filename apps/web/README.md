# Web Dashboard

The main dashboard application for My Dev Deck, built with Next.js 16 and the App Router.

## Overview

This is the primary user interface where developers interact with all the tools in My Dev Deck. It provides a unified dashboard with sidebar navigation to access different developer tools.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **React:** 19.2.0
- **Styling:** Tailwind CSS 4
- **UI Components:** @repo/ui (shared component library)
- **TypeScript:** 5.9.2

## Development

```bash
# Run development server
pnpm --filter web dev

# Build for production
pnpm --filter web build

# Start production server
pnpm --filter web start

# Type check
pnpm --filter web check-types

# Lint
pnpm --filter web lint
```

The development server runs on **http://localhost:3001**

## Structure

```
apps/web/
├── app/              # Next.js app directory (routes)
├── public/           # Static assets
├── next.config.ts    # Next.js configuration
├── tsconfig.json     # TypeScript configuration
└── package.json      # Dependencies
```

## Environment Variables

Create `.env.local` based on `.env.example`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Features

- Dashboard layout with sidebar navigation
- Tool sections (DevInbox, future tools)
- Responsive design
- Dark mode support (planned)

## Related

- API: `apps/api` - Backend API
- UI Components: `packages/ui` - Shared components
