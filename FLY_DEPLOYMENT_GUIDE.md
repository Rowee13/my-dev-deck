# Fly.io Deployment Guide

This guide will help you deploy My Dev Deck to Fly.io using their generous free tier.

## Prerequisites

- [x] Fly CLI installed (`flyctl version`)
- [x] Logged in to Fly.io (`flyctl auth login`)
- [ ] GitHub repository set up (for CI/CD)

## Free Tier Resources

You get:
- **3 shared-cpu VMs** (256MB RAM each) - We'll use 2 (API + Web)
- **3GB persistent storage** - For PostgreSQL
- **160GB outbound transfer/month**

## Step-by-Step Deployment

### 1. Create PostgreSQL Database

```bash
# Create a Postgres cluster (uses 1 VM from free tier)
flyctl postgres create --name my-dev-deck-db --region sin --initial-cluster-size 1 --vm-size shared-cpu-1x --volume-size 3

# Note: Save the connection string shown after creation!
# It looks like: postgres://postgres:password@my-dev-deck-db.internal:5432
```

**Important:** Save the username and password shown - you'll need them!

### 2. Deploy the API

```bash
# Navigate to the root directory
cd F:/dev/00_Parrow-Horrizon-Studio/my-dev-deck

# Create and deploy the API app
flyctl launch --config apps/api/fly.toml --no-deploy

# Attach the database to the API
flyctl postgres attach my-dev-deck-db --app my-dev-deck-api

# Set additional secrets (if needed)
flyctl secrets set JWT_SECRET="your-super-secret-jwt-key" --app my-dev-deck-api

# Deploy the API
flyctl deploy --config apps/api/fly.toml --dockerfile apps/api/Dockerfile
```

### 3. Deploy the Web App

```bash
# Get the API URL
flyctl info --app my-dev-deck-api

# The URL will be: https://my-dev-deck-api.fly.dev

# Create and deploy the web app
flyctl launch --config apps/web/fly.toml --no-deploy

# Set the API URL
flyctl secrets set NEXT_PUBLIC_API_URL="https://my-dev-deck-api.fly.dev" --app my-dev-deck-web

# Deploy the web app
flyctl deploy --config apps/web/fly.toml --dockerfile apps/web/Dockerfile
```

### 4. Verify Deployment

```bash
# Check API status
flyctl status --app my-dev-deck-api
flyctl logs --app my-dev-deck-api

# Check Web status
flyctl status --app my-dev-deck-web
flyctl logs --app my-dev-deck-web

# Open the apps in browser
flyctl open --app my-dev-deck-api
flyctl open --app my-dev-deck-web
```

Your apps will be available at:
- API: `https://my-dev-deck-api.fly.dev`
- Web: `https://my-dev-deck-web.fly.dev`

## Database Migrations

Run Prisma/TypeORM migrations:

```bash
# SSH into the API machine
flyctl ssh console --app my-dev-deck-api

# Inside the machine, run migrations
# For Prisma: npx prisma migrate deploy
# For TypeORM: npm run migration:run
```

Or run migrations from your local machine using the connection string:

```bash
# Export the DATABASE_URL
export DATABASE_URL="postgres://postgres:password@my-dev-deck-db.fly.dev:5432/my_dev_deck_db"

# Run migrations locally
pnpm --filter api migration:run
```

## Monitoring & Management

```bash
# View logs
flyctl logs --app my-dev-deck-api

# Scale memory (if needed, costs more)
flyctl scale memory 512 --app my-dev-deck-api

# SSH into a machine
flyctl ssh console --app my-dev-deck-api

# View metrics
flyctl dashboard --app my-dev-deck-api
```

## Troubleshooting

### Build fails
```bash
# Check build logs
flyctl logs --app my-dev-deck-api

# Try building locally first
docker build -f apps/api/Dockerfile --target production .
```

### App won't start
```bash
# Check if DATABASE_URL is set
flyctl secrets list --app my-dev-deck-api

# View startup logs
flyctl logs --app my-dev-deck-api
```

### Database connection issues
```bash
# Verify database is running
flyctl status --app my-dev-deck-db

# Test connection
flyctl postgres connect --app my-dev-deck-db
```

## Cost Optimization

Your setup uses:
- 1 VM for PostgreSQL (256MB)
- 1 VM for API (256MB)
- 1 VM for Web (256MB)
- Total: 3 VMs = **FREE** ✅

The apps will auto-stop when idle and auto-start on request (may have ~1s cold start delay).

## Next Steps

After successful deployment, set up GitHub Actions for automatic deployments (see `.github/workflows/fly-deploy.yml`).
