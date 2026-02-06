# DevInbox DNS Configuration Guide

## Overview
DevInbox requires DNS configuration to work with custom domains. This guide covers setup for Namecheap, but principles apply to any DNS provider.

## DNS Records Required

### Scenario: Using `devinbox.yourdomain.com`

| Record Type | Host | Value | Purpose |
|-------------|------|-------|---------|
| A Record | `devinbox` | `YOUR_SERVER_IP` | Web dashboard access |
| A Record | `*.devinbox` | `YOUR_SERVER_IP` | Wildcard for project email subdomains |

### Example Configuration

**Your domain**: `example.com`
**Server IP**: `123.45.67.89`

```
A Record:  devinbox          → 123.45.67.89
A Record:  *.devinbox        → 123.45.67.89
```

**Result**:
- Dashboard: `https://devinbox.example.com`
- Email for project "myapp": `anything@myapp.devinbox.example.com`

## Namecheap Setup Steps

1. **Login to Namecheap** → Go to Dashboard
2. **Domain List** → Click on your domain
3. **Advanced DNS** tab
4. **Add New Record** (repeat for each):

   **Record 1 - Dashboard:**
   - Type: `A Record`
   - Host: `devinbox`
   - Value: `YOUR_SERVER_IP`
   - TTL: `Automatic`

   **Record 2 - Wildcard Email:**
   - Type: `A Record`
   - Host: `*.devinbox`
   - Value: `YOUR_SERVER_IP`
   - TTL: `Automatic`

5. **Save All Changes**

## SSL/TLS Certificates

For HTTPS on the dashboard, you'll need SSL certificates:

### Option 1: Let's Encrypt (Free, Recommended)
```bash
# Using Certbot with wildcard
certbot certonly --manual \
  --preferred-challenges=dns \
  -d devinbox.yourdomain.com \
  -d *.devinbox.yourdomain.com
```

You'll need to add a TXT record in Namecheap during verification.

### Option 2: Cloudflare (Free SSL + Proxy)
- Add your domain to Cloudflare
- Update nameservers in Namecheap to Cloudflare's
- Enable SSL in Cloudflare (automatic)

### Option 3: Namecheap SSL Certificate
- Purchase SSL from Namecheap
- Install on your server

## Important Notes

### Port Configuration
- **Web Dashboard**: Standard HTTPS (443) or HTTP (80)
- **SMTP Server**: Port 2525 (custom, not standard 25)

### No MX Records Needed
Since DevInbox uses port 2525 (not standard port 25), you **don't need MX records**. The wildcard A record is sufficient for routing to your server.

### Firewall Rules
Ensure your server firewall allows:
```bash
Port 80   (HTTP)
Port 443  (HTTPS)
Port 2525 (SMTP for DevInbox)
```

### Testing DNS Propagation

```bash
# Check A record
nslookup devinbox.yourdomain.com

# Check wildcard
nslookup myproject.devinbox.yourdomain.com

# Or use online tool
# https://dnschecker.org
```

DNS changes can take 5 minutes to 48 hours to propagate globally.

## Using DevInbox After DNS Setup

### Configure Your Test Applications

When sending test emails from your other projects:

```env
# Example .env for your test app
SMTP_HOST=devinbox.yourdomain.com
SMTP_PORT=2525
SMTP_SECURE=false
TEST_EMAIL=test@myproject.devinbox.yourdomain.com
```

### NodeMailer Example

```javascript
const transporter = nodemailer.createTransport({
  host: 'devinbox.yourdomain.com',
  port: 2525,
  secure: false, // true for 465, false for other ports
  auth: {
    user: '', // Not required for DevInbox
    pass: ''
  }
});

await transporter.sendMail({
  from: 'sender@example.com',
  to: 'test@myproject.devinbox.yourdomain.com',
  subject: 'Test Email',
  text: 'Hello from my test app!'
});
```

## Environment Variables Update

Update your DevInbox `.env` file:

```bash
# apps/api/.env
SMTP_PORT=2525
SMTP_DOMAIN="devinbox.yourdomain.com"  # Update this

# apps/web/.env
NEXT_PUBLIC_API_URL="https://devinbox.yourdomain.com"
```

## Troubleshooting

### Email Not Received
1. Check DNS propagation: `nslookup myproject.devinbox.yourdomain.com`
2. Verify firewall allows port 2525
3. Check SMTP server logs in DevInbox API
4. Ensure sending app uses correct SMTP host and port

### Dashboard Not Accessible
1. Check DNS: `nslookup devinbox.yourdomain.com`
2. Verify server is running
3. Check firewall allows port 80/443
4. Verify SSL certificate if using HTTPS

### "Connection Refused" Error
1. Confirm server IP is correct in DNS
2. Check if ports are open: `telnet devinbox.yourdomain.com 2525`
3. Verify DevInbox API is running

## Production Deployment Checklist

- [ ] A record for `devinbox` subdomain
- [ ] Wildcard A record for `*.devinbox`
- [ ] SSL certificate installed
- [ ] Firewall rules configured (80, 443, 2525)
- [ ] DNS propagated (test with nslookup)
- [ ] Environment variables updated
- [ ] Test email send from another application
- [ ] Verify email appears in DevInbox dashboard

## Alternative: Using Localhost

For local development, no DNS needed:

```bash
# Test apps use
SMTP_HOST=localhost
SMTP_PORT=2525
TEST_EMAIL=test@myproject.devinbox.local
```

Emails sent to `*.devinbox.local` will work without any DNS configuration.
