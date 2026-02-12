# My Dev Deck

> A comprehensive toolkit of developer utilities built with modern web technologies

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![pnpm](https://img.shields.io/badge/maintained%20with-pnpm-cc00ff.svg)](https://pnpm.io/)
[![Turborepo](https://img.shields.io/badge/built%20with-Turborepo-EF4444)](https://turbo.build/repo)

## 🎯 Vision

My Dev Deck is a collection of essential development tools that developers commonly need during application development. Instead of relying on multiple third-party services, this project provides self-hosted alternatives that give you full control over your development workflow.

## 🛠️ Tools

### DevInbox ✅ Production Ready
A Mailinator-like email testing service for developers. Create projects with unique subdomains and capture all emails sent to any address under that subdomain.

**Features:**
- ✅ Project-based email isolation with subdomain routing (e.g., `anything@myproject.devinbox.local`)
- ✅ Full SMTP server receiving emails on port 2525
- ✅ Web dashboard to view and manage emails
- ✅ Support for HTML/text emails with multiple view modes
- ✅ Attachment handling with download functionality
- ✅ Email pagination and auto-refresh
- ✅ Mark emails as read/unread
- ✅ Complete REST API with Swagger documentation
- ✅ PostgreSQL database with Prisma ORM
- ✅ Docker setup for easy deployment
- ✅ No external dependencies - fully self-hosted

**Status:** 🚀 **MVP Complete & Production Ready**

**Live Features:**
- Create unlimited projects with unique slugs
- Each project gets its own email subdomain (e.g., `user@myproject.devinbox.local`)
- Real-time email reception via SMTP
- Beautiful web interface with email inbox UI
- View email details with HTML/text rendering
- Download attachments
- Project management (create, view, update, delete)
- RESTful API for programmatic access

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
pnpm --filter web dev       # Dashboard (http://localhost:4001)
pnpm --filter docs dev      # Docs (http://localhost:4002)
pnpm --filter api start:dev # API (http://localhost:4000, SMTP: 2525)
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

Full Docker Compose setup is available for local development and production deployment.

```bash
# Start all services (PostgreSQL + API + Web)
docker-compose up

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

All development files are volume-mounted for hot reload. See `docker-compose.yml` for configuration details.

## 🌐 Deployment Options

DevInbox is production-ready and can be deployed to various platforms. Here are the recommended free and self-hosted options:

### Option 1: Railway.app (Recommended for Easy Deployment)

**Why Railway:**
- $5/month free credit (sufficient for small projects)
- Native PostgreSQL support
- Supports custom TCP ports (critical for SMTP on port 2525)
- Auto-deploys from GitHub
- Easy environment variable management
- Custom domains included

**Deployment Steps:**
1. Create a Railway account at [railway.app](https://railway.app)
2. Create a new project
3. Add PostgreSQL database from template
4. Deploy API service from `apps/api` Dockerfile
5. Deploy Web service from `apps/web` Dockerfile
6. Configure environment variables:
   - `DATABASE_URL` (from Railway PostgreSQL)
   - `SMTP_PORT=2525`
   - `SMTP_DOMAIN=your-domain.com`
   - `CORS_ORIGINS=https://your-web-app.railway.app`
7. Expose TCP port 2525 for SMTP server
8. Set up custom domain (optional)

**Cost:** Free tier with $5/month credit, then pay-as-you-go

### Option 2: Oracle Cloud Free Tier (Best for Self-Hosting)

**Why Oracle Cloud:**
- **Forever free tier** with generous resources (4 ARM CPUs, 24GB RAM)
- Full control over VM and ports
- Can run the exact `docker-compose.yml` setup
- No spending limits or surprises
- Great for self-hosting and learning

**Deployment Steps:**
1. Create Oracle Cloud account (free tier)
2. Launch Ubuntu VM instance (ARM or x86)
3. SSH into the instance
4. Install Docker and Docker Compose:
   ```bash
   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh

   # Install Docker Compose
   sudo apt-get update
   sudo apt-get install docker-compose-plugin
   ```
5. Clone your repository:
   ```bash
   git clone https://github.com/yourusername/my-dev-deck.git
   cd my-dev-deck
   ```
6. Configure environment variables:
   ```bash
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env
   # Edit .env files with your settings
   ```
7. Run with Docker Compose:
   ```bash
   docker-compose up -d
   ```
8. Configure firewall rules:
   - Open ports 4000 (API), 4001 (Web), 2525 (SMTP)
   - Set up nginx as reverse proxy (recommended)
9. (Optional) Set up SSL with Let's Encrypt

**Cost:** Free forever

### Option 3: Fly.io (Docker-Native Platform)

**Why Fly.io:**
- Free tier: 3 shared VMs, 3GB persistent storage
- Supports custom TCP ports (SMTP compatible)
- Docker-native platform
- Global edge network
- Simple `fly.toml` configuration

**Deployment Steps:**
1. Install flyctl CLI: `curl -L https://fly.io/install.sh | sh`
2. Login: `flyctl auth login`
3. Launch services:
   ```bash
   # Deploy API
   cd apps/api
   flyctl launch --dockerfile Dockerfile

   # Deploy Web
   cd apps/web
   flyctl launch --dockerfile Dockerfile
   ```
4. Add PostgreSQL: `flyctl postgres create`
5. Configure environment variables with `flyctl secrets set`
6. Expose TCP port 2525 for SMTP in `fly.toml`

**Cost:** Free tier, then pay-as-you-go

### Environment Variables

Each deployment requires configuration. See example files:
- `apps/api/.env.example` - Database, SMTP, API config
- `apps/web/.env.example` - API URL and frontend config

**Key Variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - API HTTP port (default: 4000)
- `SMTP_PORT` - SMTP server port (default: 2525)
- `SMTP_DOMAIN` - Domain for email routing (e.g., devinbox.local)
- `CORS_ORIGINS` - Allowed origins for CORS
- `NEXT_PUBLIC_API_URL` - API endpoint for web app

### Production Checklist

Before deploying to production:
- [ ] Set strong database password
- [ ] Configure CORS origins for your domain
- [ ] Set up SSL/TLS certificates (Let's Encrypt)
- [ ] Configure firewall rules
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy for PostgreSQL
- [ ] Update SMTP_DOMAIN to your actual domain
- [ ] (Optional) Set up authentication for multi-user support

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

**Note:** This project is under active development. The first tool (DevInbox) is **production-ready** and fully functional! Star and watch this repository to follow the progress as we add more developer tools.
