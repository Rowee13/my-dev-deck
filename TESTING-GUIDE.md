# Authentication Testing Guide

This guide covers comprehensive testing of the authentication system.

## Prerequisites

- API running on `http://localhost:4000`
- Web app running on `http://localhost:4001`
- Node.js installed (for running test scripts)

## 🧪 Automated Tests

### Setup

1. Open each test script and update the credentials:
   - `test-refresh-token.js` - Update email and password (lines 15-16)
   - `test-rate-limit.js` - Update email (line 8)
   - `test-password-change.js` - Update email and password (lines 7-8)

### Test 1: Rotational Refresh Token (One-Time Use)

**What it tests:** Verifies that refresh tokens can only be used once, improving security.

```bash
node test-refresh-token.js
```

**Expected Output:**
```
✅ Login successful
✅ First refresh successful
✅ CORRECT: Old refresh token rejected (one-time use working)
```

**What should happen:**
- Login succeeds and gets initial tokens
- First refresh succeeds and gets new tokens
- Second refresh with OLD token fails (401 Unauthorized)
- Old token is marked as revoked in database

---

### Test 2: Rate Limiting (5 attempts per 15 minutes)

**What it tests:** Verifies that login attempts are limited to prevent brute force attacks.

```bash
node test-rate-limit.js
```

**Expected Output:**
```
Attempt 1: ❌ Status 401 - Unauthorized
Attempt 2: ❌ Status 401 - Unauthorized
...
Attempt 6: ❌ Status 429 - Too Many Requests (RATE LIMITED)
✅ Rate limiting is working correctly!
```

**What should happen:**
- First 5 attempts return 401 (wrong password)
- 6th attempt returns 429 (Too Many Requests)
- User is blocked for 15 minutes

**To reset rate limit:**
Wait 15 minutes or restart the API server.

---

### Test 3: Password Change & Token Revocation

**What it tests:** Verifies that changing password revokes all existing refresh tokens.

```bash
node test-password-change.js
```

**Expected Output:**
```
✅ Login successful
✅ Password changed successfully
✅ CORRECT: Old refresh token was revoked
✅ CORRECT: Old password rejected
✅ New password login successful
✅ Password reverted to original
✨ All password change tests passed!
```

**What should happen:**
- Password change succeeds
- All old refresh tokens become invalid
- Old password no longer works
- New password works for login
- Test automatically reverts password to original

---

## 🖱️ Manual Browser Tests

### Test 4: Automatic Token Refresh in Browser

**Steps:**
1. Login at `http://localhost:4001`
2. Open DevTools (F12) → Application → Cookies
3. Delete the `accessToken` cookie (keep `refreshToken`)
4. Navigate to any page or refresh

**Expected Result:**
- ✅ Page loads successfully
- ✅ New `accessToken` appears in cookies
- ✅ New `refreshToken` also appears (rotational)
- ✅ No redirect to login page

---

### Test 5: Route Protection

**Test A: Accessing dashboard without auth**
1. Clear all cookies (or use incognito mode)
2. Try to access `http://localhost:4001/dashboard`

**Expected:** Redirects to `/login`

**Test B: Accessing login while authenticated**
1. Login successfully
2. Try to access `http://localhost:4001/login`

**Expected:** Redirects to `/dashboard`

---

### Test 6: Password Change UI

**Steps:**
1. Login and go to Settings page
2. Click "Change Password"
3. Test validation:
   - Enter wrong current password → should show error
   - Enter mismatched new passwords → should show error
   - Enter weak password → should show error
4. Successfully change password
5. Logout and login with new password
6. Change password back to original

**Expected Results:**
- ✅ Validation errors display correctly
- ✅ Password change succeeds
- ✅ Success message shows and modal closes
- ✅ Old password no longer works
- ✅ New password works for login

---

### Test 7: Session Persistence

**Steps:**
1. Login to dashboard
2. Create a project
3. Close browser completely
4. Reopen browser and go to `http://localhost:4001`

**Expected Result:**
- ✅ Still logged in (cookies persist)
- ✅ Projects still visible
- ✅ Can perform actions without re-login

---

### Test 8: SMTP Server (No Auth Required)

**What it tests:** Verifies that SMTP server remains publicly accessible.

**Steps:**
1. Create a project in DevInbox
2. Note the email address (e.g., `*@myproject.devinbox.local`)
3. Send a test email to port 2525:

**Using netcat (Linux/Mac):**
```bash
nc localhost 2525
HELO test
MAIL FROM: <sender@example.com>
RCPT TO: <test@myproject.devinbox.local>
DATA
Subject: Test Email
This is a test email.
.
QUIT
```

**Using Telnet (Windows):**
```
telnet localhost 2525
HELO test
MAIL FROM: <sender@example.com>
RCPT TO: <test@myproject.devinbox.local>
DATA
Subject: Test Email
This is a test email.
.
QUIT
```

**Expected Result:**
- ✅ SMTP accepts connection without authentication
- ✅ Email appears in project inbox
- ✅ Can view email in dashboard

---

## 🔒 Security Verification Checklist

- [ ] Passwords are hashed with bcrypt (12 salt rounds)
- [ ] Refresh tokens are hashed before storage
- [ ] Refresh tokens are one-time use (revoked after use)
- [ ] Changing password revokes all refresh tokens
- [ ] Access tokens expire after 24 hours
- [ ] Refresh tokens expire after 30 days
- [ ] Login attempts are rate limited (5 per 15 minutes)
- [ ] Protected routes redirect to login when not authenticated
- [ ] API endpoints return 401 without valid access token
- [ ] SMTP server remains public (no auth required)
- [ ] JWT secret is loaded from environment (not hardcoded)
- [ ] Old refresh tokens cannot be reused

---

## 📊 Testing Results

After running all tests, document your results:

| Test | Status | Notes |
|------|--------|-------|
| Rotational Refresh Token | ⬜ Pass / ⬜ Fail | |
| Rate Limiting | ⬜ Pass / ⬜ Fail | |
| Password Change & Revocation | ⬜ Pass / ⬜ Fail | |
| Automatic Token Refresh (Browser) | ⬜ Pass / ⬜ Fail | |
| Route Protection | ⬜ Pass / ⬜ Fail | |
| Password Change UI | ⬜ Pass / ⬜ Fail | |
| Session Persistence | ⬜ Pass / ⬜ Fail | |
| SMTP Public Access | ⬜ Pass / ⬜ Fail | |

---

## 🐛 Troubleshooting

**Test scripts fail with "Login failed":**
- Verify your credentials are correct in the test files
- Ensure API is running on port 4000
- Check if you've been rate limited (wait 15 min or restart API)

**Rate limiting doesn't trigger:**
- Check if `@nestjs/throttler` is properly installed
- Verify ThrottlerGuard is applied in auth.controller.ts
- Check API logs for throttler messages

**Token refresh doesn't work:**
- Check browser console for errors
- Verify refreshToken cookie exists
- Check API logs for refresh endpoint errors
- Ensure JWT_SECRET is set in .env

**SMTP doesn't receive emails:**
- Verify SMTP server is running (check API logs on startup)
- Ensure port 2525 is not blocked by firewall
- Check project slug matches the email domain
