# Deploying My Dev Deck to Oracle Cloud (Always Free Tier)

This guide walks you through deploying My Dev Deck on Oracle Cloud's Always Free tier.

## Oracle Cloud Always Free Tier

**What you get for FREE (forever):**
- **Compute**: Up to 4 ARM-based Ampere A1 cores + 24 GB RAM (can split into multiple VMs)
- **Storage**: 200 GB Block Volume storage
- **Networking**: 10 TB outbound data transfer per month
- **Database**: 2 Oracle Autonomous Databases (but we'll use PostgreSQL in Docker)

**Perfect for:** Small to medium projects, personal use, portfolio demos

---

## Prerequisites

- Oracle Cloud account ([sign up here](https://www.oracle.com/cloud/free/))
- Domain name (optional, can use IP address)
- SSH key pair (we'll generate one)

---

## Step 1: Create Oracle Cloud Account

1. Go to https://www.oracle.com/cloud/free/
2. Click "Start for free"
3. Fill in your details (requires credit card for verification, but won't charge)
4. Wait for account activation (can take a few minutes)

---

## Step 2: Create a Compute Instance (VM)

### 2.1 Launch Instance

1. Login to Oracle Cloud Console
2. Click **☰** (hamburger menu) → **Compute** → **Instances**
3. Click **Create Instance**

### 2.2 Configure Instance

**Name:** `my-dev-deck-vm`

**Placement:**
- Leave defaults (Availability Domain)

**Image and Shape:**
1. Click **Edit** next to "Image and shape"
2. **Change Image**: Click "Change Image"
   - Select: **Canonical Ubuntu** (22.04 or latest)
   - Click "Select Image"
3. **Change Shape**: Click "Change Shape"
   - Select: **Ampere** (ARM-based)
   - Select: **VM.Standard.A1.Flex**
   - Set: **4 OCPUs** and **24 GB RAM** (uses full Always Free allocation)
   - Click "Select Shape"

**Networking:**
- **VCN**: Create new VCN (or use existing)
- **Subnet**: Create new subnet (or use existing)
- **Public IP**: ✅ Assign a public IPv4 address

**Add SSH Keys:**
1. Choose **"Generate a key pair for me"**
2. Click **Save Private Key** (save as `my-dev-deck-key.pem`)
3. Click **Save Public Key** (optional, for reference)

**Boot Volume:**
- Leave default (50 GB is enough, but you can increase up to 200 GB free)

### 2.3 Create Instance

Click **Create** and wait 2-3 minutes for provisioning.

### 2.4 Note Your Public IP

Once instance is **Running**, note the **Public IP Address** (e.g., `xxx.xxx.xxx.xxx`)

---

## Step 3: Configure Firewall Rules

### 3.1 Open Required Ports

1. Go to your instance details page
2. Click on the **VCN name** (e.g., vcn-xxxxxx)
3. Click on **subnet name** (e.g., subnet-xxxxxx)
4. Click on the **Security List** (e.g., Default Security List)
5. Click **Add Ingress Rules**

Add these rules one by one:

**Rule 1: HTTP (Port 80)**
- **Source CIDR**: `0.0.0.0/0`
- **IP Protocol**: TCP
- **Destination Port Range**: `80`
- **Description**: HTTP

**Rule 2: HTTPS (Port 443)**
- **Source CIDR**: `0.0.0.0/0`
- **IP Protocol**: TCP
- **Destination Port Range**: `443`
- **Description**: HTTPS

**Rule 3: Web App (Port 4001)**
- **Source CIDR**: `0.0.0.0/0`
- **IP Protocol**: TCP
- **Destination Port Range**: `4001`
- **Description**: Next.js Web App

**Rule 4: API (Port 4000)**
- **Source CIDR**: `0.0.0.0/0`
- **IP Protocol**: TCP
- **Destination Port Range**: `4000`
- **Description**: NestJS API

**Rule 5: SMTP (Port 2525)**
- **Source CIDR**: `0.0.0.0/0`
- **IP Protocol**: TCP
- **Destination Port Range**: `2525`
- **Description**: SMTP Server

---

## Step 4: Connect to Your VM

### 4.1 Fix SSH Key Permissions (Windows)

If on Windows, use Git Bash or WSL:

```bash
# Move key to safe location
mv ~/Downloads/my-dev-deck-key.pem ~/.ssh/
chmod 400 ~/.ssh/my-dev-deck-key.pem
```

### 4.2 SSH into VM

```bash
ssh -i ~/.ssh/my-dev-deck-key.pem ubuntu@YOUR_PUBLIC_IP
```

Replace `YOUR_PUBLIC_IP` with your actual IP address.

**First time:** Type `yes` when asked about host authenticity.

---

## Step 5: Install Dependencies on VM

### 5.1 Update System

```bash
sudo apt update && sudo apt upgrade -y
```

### 5.2 Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group (no sudo needed)
sudo usermod -aG docker $USER

# Start Docker on boot
sudo systemctl enable docker

# Apply group changes (or logout/login)
newgrp docker
```

### 5.3 Install Docker Compose

```bash
# Install Docker Compose
sudo apt install docker-compose -y

# Verify installation
docker --version
docker-compose --version
```

### 5.4 Install Git

```bash
sudo apt install git -y
```

---

## Step 6: Configure VM Firewall (iptables)

Oracle VMs also have an internal firewall. Open the required ports:

```bash
# Allow ports 80, 443, 4000, 4001, 2525
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 4000 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 4001 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 2525 -j ACCEPT

# Save rules
sudo netfilter-persistent save
```

If `netfilter-persistent` doesn't exist:

```bash
sudo apt install iptables-persistent -y
sudo netfilter-persistent save
```

---

## Step 7: Clone and Configure the Project

### 7.1 Clone Repository

```bash
cd ~
git clone https://github.com/Rowee13/my-dev-deck.git
cd my-dev-deck
```

### 7.2 Create Environment Files

**API Environment (.env for api):**

```bash
nano apps/api/.env
```

Add:

```env
# Database
DATABASE_URL="postgresql://postgres:your-secure-password@postgres:5432/devdeck?schema=public"

# JWT Authentication (generate a secure secret)
JWT_SECRET="your-super-secret-jwt-key-change-this"
JWT_ACCESS_EXPIRATION="24h"
JWT_REFRESH_EXPIRATION="30d"

# Rate Limiting
LOGIN_RATE_LIMIT_TTL=900
LOGIN_RATE_LIMIT_MAX=5

# API
PORT=4000

# CORS
CORS_ORIGINS="http://YOUR_PUBLIC_IP:4001,http://localhost:4001"

# SMTP
SMTP_PORT=2525
SMTP_DOMAIN="devinbox.local"
```

**Generate JWT_SECRET:**

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy the output and paste it as `JWT_SECRET` value.

**Replace `YOUR_PUBLIC_IP`** with your actual Oracle Cloud public IP.

**Save:** Press `Ctrl+X`, then `Y`, then `Enter`

---

**Web Environment (.env.local for web):**

```bash
nano apps/web/.env.local
```

Add:

```env
NEXT_PUBLIC_API_URL=http://YOUR_PUBLIC_IP:4000
```

**Save:** Press `Ctrl+X`, then `Y`, then `Enter`

---

**Docker Compose Environment (.env in root):**

```bash
nano .env
```

Add:

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-secure-password
POSTGRES_DB=devdeck
```

**Save:** Press `Ctrl+X`, then `Y`, then `Enter`

---

## Step 8: Deploy with Docker Compose

### 8.1 Start Services

```bash
docker-compose up -d
```

This will:
- Pull Docker images
- Build the API and Web apps
- Start PostgreSQL, API, and Web services

**First build takes 5-10 minutes.**

### 8.2 Check Status

```bash
docker-compose ps
```

All services should show "Up".

### 8.3 View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f web
```

Press `Ctrl+C` to exit logs.

---

## Step 9: Run Database Migrations

```bash
docker-compose exec api npx prisma migrate deploy
```

---

## Step 10: Access Your App

Open your browser and go to:

```
http://YOUR_PUBLIC_IP:4001
```

You should see the **My Dev Deck setup page**!

---

## Step 11: First-Time Setup

1. Go to `http://YOUR_PUBLIC_IP:4001/setup`
2. Create your owner account
3. Login and start using DevInbox!

---

## Step 12: Test SMTP Server

```bash
telnet YOUR_PUBLIC_IP 2525
```

Or from your local machine:

```bash
nc YOUR_PUBLIC_IP 2525
HELO test
MAIL FROM: <sender@example.com>
RCPT TO: <test@myproject.devinbox.local>
DATA
Subject: Test Email
This is a test
.
QUIT
```

---

## Optional: Set Up Domain and SSL

### Option A: Use Cloudflare Tunnel (Easiest)

**Free HTTPS without opening ports or SSL certificates:**

1. Sign up for Cloudflare (free)
2. Add your domain
3. Install `cloudflared` on your VM:

```bash
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64.deb
sudo dpkg -i cloudflared-linux-arm64.deb
cloudflared tunnel login
```

4. Create tunnel:

```bash
cloudflared tunnel create my-dev-deck
cloudflared tunnel route dns my-dev-deck mydevdeck.yourdomain.com
```

5. Create config:

```bash
nano ~/.cloudflared/config.yml
```

Add:

```yaml
tunnel: <TUNNEL_ID_FROM_CREATE_COMMAND>
credentials-file: /home/ubuntu/.cloudflared/<TUNNEL_ID>.json

ingress:
  - hostname: mydevdeck.yourdomain.com
    service: http://localhost:4001
  - hostname: api.mydevdeck.yourdomain.com
    service: http://localhost:4000
  - service: http_status:404
```

6. Run tunnel:

```bash
cloudflared tunnel run my-dev-deck
```

7. Set up as service (autostart):

```bash
sudo cloudflared service install
sudo systemctl start cloudflared
sudo systemctl enable cloudflared
```

Now access via: `https://mydevdeck.yourdomain.com`

---

### Option B: Traditional Nginx + Let's Encrypt

**If you prefer traditional setup:**

1. Install Nginx:

```bash
sudo apt install nginx certbot python3-certbot-nginx -y
```

2. Configure Nginx:

```bash
sudo nano /etc/nginx/sites-available/my-dev-deck
```

Add:

```nginx
server {
    listen 80;
    server_name mydevdeck.yourdomain.com;

    location / {
        proxy_pass http://localhost:4001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 80;
    server_name api.mydevdeck.yourdomain.com;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

3. Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/my-dev-deck /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

4. Get SSL certificates:

```bash
sudo certbot --nginx -d mydevdeck.yourdomain.com -d api.mydevdeck.yourdomain.com
```

5. Update `.env` files to use HTTPS URLs.

---

## Managing Your Deployment

### Start/Stop Services

```bash
# Stop all
docker-compose down

# Start all
docker-compose up -d

# Restart specific service
docker-compose restart api
docker-compose restart web
```

### Update Deployment (Pull Latest Code)

```bash
cd ~/my-dev-deck
git pull
docker-compose down
docker-compose up -d --build
docker-compose exec api npx prisma migrate deploy
```

### View Logs

```bash
docker-compose logs -f
```

### Database Backup

```bash
docker-compose exec postgres pg_dump -U postgres devdeck > backup-$(date +%Y%m%d).sql
```

### Database Restore

```bash
cat backup-20260212.sql | docker-compose exec -T postgres psql -U postgres devdeck
```

---

## Monitoring Resource Usage

```bash
# Check VM resources
htop

# Check Docker resources
docker stats

# Check disk usage
df -h
```

---

## Troubleshooting

### Services Won't Start

```bash
# Check logs
docker-compose logs

# Rebuild
docker-compose down
docker-compose up -d --build
```

### Can't Access from Browser

1. Check Oracle Cloud security list (ports open)
2. Check VM firewall: `sudo iptables -L -n`
3. Check services running: `docker-compose ps`
4. Check logs: `docker-compose logs`

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Check DATABASE_URL in apps/api/.env
cat apps/api/.env | grep DATABASE_URL

# Test connection
docker-compose exec postgres psql -U postgres -d devdeck
```

### Out of Memory

The free tier VM has 24 GB RAM which should be plenty. If issues:

```bash
# Check memory
free -h

# Restart services one by one
docker-compose restart postgres
sleep 10
docker-compose restart api
sleep 10
docker-compose restart web
```

---

## Costs

**Oracle Cloud Always Free Tier:**
- ✅ Compute: FREE
- ✅ Storage: FREE
- ✅ Network: FREE (10 TB/month outbound)
- ✅ No time limit - FREE FOREVER

**Additional Costs (if you exceed free tier):**
- Only if you manually upgrade or add paid resources
- You'll get warnings before any charges

---

## Security Best Practices

1. **Change default passwords** in .env files
2. **Keep system updated**: `sudo apt update && sudo apt upgrade -y`
3. **Use strong JWT_SECRET**: Generate with crypto
4. **Enable firewall**: Already configured in Step 6
5. **Regular backups**: Set up automated database backups
6. **Use HTTPS**: Set up SSL with Cloudflare or Let's Encrypt
7. **Monitor logs**: Check `docker-compose logs` regularly

---

## Next Steps

- ✅ Set up custom domain
- ✅ Enable HTTPS/SSL
- ✅ Set up automated backups
- ✅ Configure monitoring (optional: Uptime Robot, Grafana)
- ✅ Set up CI/CD (GitHub Actions to auto-deploy on push)

---

## Support

- **Oracle Cloud Docs**: https://docs.oracle.com/en-us/iaas/Content/home.htm
- **My Dev Deck Issues**: https://github.com/Rowee13/my-dev-deck/issues
- **Docker Docs**: https://docs.docker.com/

---

**🎉 Congratulations!** Your My Dev Deck is now deployed on Oracle Cloud's Always Free tier!
