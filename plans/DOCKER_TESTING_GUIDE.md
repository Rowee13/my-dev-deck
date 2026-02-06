# Docker Compose Testing Guide

## Prerequisites

Make sure you have installed:
- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- Docker Compose (usually included with Docker Desktop)

Verify installation:
```bash
docker --version
docker-compose --version
```

---

## Step 1: Create Environment Files

Before running Docker, create `.env` files from the examples:

```bash
# API environment file
cp apps/api/.env.example apps/api/.env

# Web environment file
cp apps/web/.env.example apps/web/.env

# Docs environment file (optional)
cp apps/docs/.env.example apps/docs/.env
```

The default values in `.env.example` files are already configured for Docker, so you don't need to change anything.

---

## Step 2: Start PostgreSQL Database Only (First Test)

Let's start with just the database to make sure it works:

```bash
docker-compose up postgres
```

**Expected output:**
- You should see PostgreSQL initializing
- Look for: `database system is ready to accept connections`
- No errors about ports being in use

**Press `Ctrl+C`** to stop when you see it's ready.

---

## Step 3: Build All Services

Build the Docker images (this may take 5-10 minutes the first time):

```bash
docker-compose build
```

**Expected output:**
- Building images for api, web, and docs
- Installing pnpm packages
- No build errors

---

## Step 4: Start All Services

Start all services in detached mode (background):

```bash
docker-compose up -d
```

Or start with logs visible (foreground):

```bash
docker-compose up
```

**Services that will start:**
- `postgres` - PostgreSQL database (port 5432)
- `api` - NestJS backend (port 3000 & 2525)
- `web` - Next.js dashboard (port 3001)

---

## Step 5: Check Service Status

```bash
# See running containers
docker-compose ps

# Check logs for all services
docker-compose logs

# Check logs for specific service
docker-compose logs api
docker-compose logs web
docker-compose logs postgres

# Follow logs in real-time
docker-compose logs -f api
```

**Expected status:**
All services should show as "Up" or "running"

---

## Step 6: Verify Services Are Working

### Check API (NestJS)
```bash
# Using curl
curl http://localhost:3000

# Or open in browser
# http://localhost:3000
```

**Expected:** Should return "Hello World!" or the default NestJS response

### Check Web Dashboard (Next.js)
```bash
# Open in browser
# http://localhost:3001
```

**Expected:** Should show the Next.js app (even if it's just the default page)

### Check Database Connection
```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U postgres -d devdeck

# Once inside, try:
\l              # List databases
\dt             # List tables (none yet, that's OK)
\q              # Quit
```

---

## Step 7: Test Hot Reload (Optional)

With services running, make a small change to test hot reload:

### Test API hot reload:
1. Edit `apps/api/src/app.service.ts`
2. Change the return message in `getHello()`
3. Check logs: `docker-compose logs -f api`
4. You should see NestJS recompiling
5. Visit `http://localhost:3000` - message should update

### Test Web hot reload:
1. Edit any file in `apps/web/app/`
2. Check logs: `docker-compose logs -f web`
3. Refresh browser - changes should appear

---

## Step 8: Common Issues & Troubleshooting

### Issue: Port already in use
```bash
# Find what's using the port
# Windows (PowerShell):
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess

# Linux/Mac:
lsof -i :3000

# Solution: Stop the conflicting service or change ports in docker-compose.yml
```

### Issue: Services won't start
```bash
# Stop everything and remove volumes
docker-compose down -v

# Rebuild from scratch
docker-compose build --no-cache

# Start again
docker-compose up
```

### Issue: Database connection errors
```bash
# Make sure postgres is healthy before API starts
docker-compose logs postgres

# Restart API after postgres is ready
docker-compose restart api
```

### Issue: Out of disk space
```bash
# Clean up old Docker data
docker system prune -a

# Remove all stopped containers and unused images
docker-compose down
docker system df  # Check disk usage
```

---

## Step 9: Stop Services

### Stop but keep data (volumes):
```bash
docker-compose stop
```

### Stop and remove containers (but keep volumes/data):
```bash
docker-compose down
```

### Stop and remove EVERYTHING including data:
```bash
docker-compose down -v
```

---

## Step 10: Run with Docs App (Optional)

The docs app uses a profile to keep it optional:

```bash
# Start with docs included
docker-compose --profile full up

# Or build with docs
docker-compose --profile full build
```

---

## Quick Reference Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Restart a specific service
docker-compose restart api

# Execute command in container
docker-compose exec api pnpm --filter api test

# Access database shell
docker-compose exec postgres psql -U postgres -d devdeck

# See resource usage
docker stats

# Clean everything and start fresh
docker-compose down -v && docker-compose build --no-cache && docker-compose up
```

---

## Expected Behavior After Successful Setup

✅ **PostgreSQL**: Running on port 5432, accessible from API
✅ **API**: Running on port 3000, responds to HTTP requests, SMTP on 2525
✅ **Web**: Running on port 3001, shows Next.js app
✅ **Hot Reload**: Code changes automatically reload services
✅ **Logs**: Clean logs with no continuous errors

---

## Notes

- **First build is slow** (5-10 min) due to pnpm install - subsequent builds are cached
- **Database data persists** in Docker volumes even after `docker-compose down`
- **Use `-v` flag** only when you want to completely reset the database
- **Windows users**: May need to configure Docker Desktop to share drives in Settings

---

Ready to test? Start with **Step 1** and let me know if you hit any issues! 🚀
