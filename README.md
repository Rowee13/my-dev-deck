# My Dev Deck

> A comprehensive toolkit of developer utilities built with modern web technologies

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![pnpm](https://img.shields.io/badge/maintained%20with-pnpm-cc00ff.svg)](https://pnpm.io/)
[![Turborepo](https://img.shields.io/badge/built%20with-Turborepo-EF4444)](https://turbo.build/repo)

## 🎯 Vision

My Dev Deck is a collection of essential development tools that developers commonly need during application development. Instead of relying on multiple third-party services, this project provides self-hosted alternatives that give you full control over your development workflow.

## 🛠️ Tools

### DevInbox (In Development)
A Mailinator-like email testing service for developers. Create projects with unique subdomains and capture all emails sent to any address under that subdomain.

**Features:**
- Project-based email isolation with subdomain routing (e.g., `anything@myproject.devinbox.local`)
- Web dashboard to view and manage emails
- Support for HTML/text emails and attachments
- No external dependencies - fully self-hosted

**Status:** 🚧 Planning & Design Phase

### Future Tools
More developer utilities coming soon! Ideas include:
- Webhook testing and debugging
- File sharing and temporary storage
- API mocking and testing
- And more...

## 🏗️ Project Structure

This is a **Turborepo** monorepo using **pnpm** workspaces:

```
my-dev-deck/
├── apps/
│   ├── web/          # Next.js dashboard (main UI)
│   ├── docs/         # Next.js documentation site
│   └── api/          # NestJS backend API
├── packages/
│   ├── ui/           # Shared React components with Tailwind CSS
│   ├── eslint-config/       # Shared ESLint configuration
│   ├── typescript-config/   # Shared TypeScript configs
│   └── tailwind-config/     # Shared Tailwind/PostCSS config
└── ...
```

### Tech Stack

- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS 4
- **Backend:** NestJS, PostgreSQL, Prisma
- **Monorepo:** Turborepo, pnpm workspaces
- **Language:** TypeScript
- **Testing:** Jest (API), Playwright (planned for E2E)

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18
- pnpm >= 10.19.0
- PostgreSQL (for backend features)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/my-dev-deck.git
cd my-dev-deck

# Install dependencies
pnpm install
```

### Development

```bash
# Run all apps in development mode
pnpm dev

# Run specific app
pnpm --filter web dev       # Dashboard (http://localhost:3001)
pnpm --filter docs dev      # Docs (http://localhost:3000)
pnpm --filter api start:dev # API (http://localhost:3000)
```

### Building

```bash
# Build all apps and packages
pnpm build

# Build specific app
pnpm --filter web build
pnpm --filter api build
```

### Testing

```bash
# Run tests
pnpm --filter api test

# Run tests with coverage
pnpm --filter api test:cov

# Type checking
pnpm check-types

# Linting
pnpm lint
```

## 🐳 Docker Setup

(Docker setup coming soon - see Task #8 in open source preparation)

## 📖 Documentation

- [CLAUDE.md](./CLAUDE.md) - Repository guidance for Claude Code
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Contribution guidelines
- [DevInbox Implementation Plan](./DEVINBOX_IMPLEMENTATION_PLAN.md) - Detailed plan for the first tool

## 🤝 Contributing

Contributions are welcome! This project is built in public to showcase development capabilities and to help the developer community.

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for details on the development process and how to submit pull requests.

## 📝 Development Philosophy

- **Build in Public:** All development happens in the open
- **Developer First:** Tools built by developers, for developers
- **Self-Hosted:** Full control over your data and infrastructure
- **Modern Stack:** Using cutting-edge technologies and best practices
- **Type Safe:** TypeScript everywhere for better DX

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Turborepo](https://turbo.build/repo)
- UI powered by [Tailwind CSS](https://tailwindcss.com/)
- Backend with [NestJS](https://nestjs.com/)
- Frontend with [Next.js](https://nextjs.org/)

## 📬 Contact

**Parrow Horrizon Studio**

- GitHub: [@yourusername](https://github.com/yourusername) (Update this!)
- Project Link: [https://github.com/yourusername/my-dev-deck](https://github.com/yourusername/my-dev-deck) (Update this!)

---

**Note:** This project is under active development. The first tool (DevInbox) is currently in the planning phase. Star and watch this repository to follow the progress!
