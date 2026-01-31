# Documentation Site

Documentation and guides for My Dev Deck, built with Next.js.

## Overview

This application provides comprehensive documentation, tutorials, and guides for using My Dev Deck and its tools.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **React:** 19.2.0
- **Styling:** Tailwind CSS 4
- **TypeScript:** 5.9.2

## Development

```bash
# Run development server
pnpm --filter docs dev

# Build for production
pnpm --filter docs build

# Start production server
pnpm --filter docs start

# Type check
pnpm --filter docs check-types

# Lint
pnpm --filter docs lint
```

The development server runs on **http://localhost:3000**

## Structure

```
apps/docs/
├── app/              # Next.js app directory (routes)
├── public/           # Static assets
├── next.config.ts    # Next.js configuration
└── package.json      # Dependencies
```

## Content

Documentation includes:
- Getting started guides
- Tool-specific documentation
- API reference
- Architecture diagrams
- Deployment guides

## Related

- Main App: `apps/web` - Dashboard
- API: `apps/api` - Backend
