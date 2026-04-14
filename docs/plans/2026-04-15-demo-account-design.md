# Demo Account — Design

**Date:** 2026-04-15
**Status:** Approved, ready for implementation plan
**Scope:** My Dev Deck (umbrella app). Current tool: DevInbox. Future tools must fit the same demo pattern.

## Goal

Let anyone click "Try Demo" on the login page and explore a real, writable instance of My Dev Deck without signing up. The demo must showcase real write flows (create project, receive/inject email, mark read, delete) without exposing real SMTP to anonymous traffic, and must be safe to run in a public open-source deployment.

## Model

**Ephemeral per-session demo accounts with a 1-hour hard TTL.**

- User clicks "Try Demo" → backend creates a throwaway `User` row flagged `isDemo=true`, seeds data, returns JWT cookies.
- The user experiences the full product UI with capped resources.
- After 1 hour from creation, a cron deletes the user and all their data via Prisma cascade.

**Capability level: L2 (sandbox writes, no real SMTP).** Demo users can create projects and manage emails, but cannot receive real inbound SMTP email. Instead, an "Inject test email" button adds realistic fake emails into their projects. This avoids exposing SMTP to anonymous abuse while still letting the user feel the write flows.

## Data model

Add one column to `User`:

```prisma
model User {
  // ...existing fields...
  isDemo    Boolean  @default(false) @map("is_demo")
  // createdAt already exists and is sufficient for TTL calculation
}
```

No separate table. The flag is enough to filter for cleanup, block sensitive routes, and drive UI.

## Auth flow

**New endpoint:** `POST /api/auth/demo` (public, rate-limited).

- Creates a `User` with:
  - `email`: `demo-<short-uuid>@demo.local` (unique, unused for real delivery)
  - `password`: random unusable bcrypt hash (no password is ever issued, so login by password is impossible)
  - `name`: `Demo User`
  - `isDemo`: `true`
- Runs demo seeders (see Extensibility).
- Returns JWT cookies via the same `setAuthCookies` path as real login.
- Rate-limited to **2 demo creations per IP per hour** via `@nestjs/throttler` (same pattern as `/login`).

Because there is no password, there is no brute-force or enumeration surface on demo accounts.

## Blocked routes for demo users

A `@BlockDemo()` decorator + guard rejects routes that don't make sense for demo users or that could be used to escalate/claim the account. Returns `403 Forbidden` with `{ message: "Not available in demo mode" }`.

Initial blocked list:
- `POST /api/auth/change-password`
- Any future account-settings / billing / convert-to-real-account route

The guard reads `req.user.isDemo` (populated by the existing JWT strategy).

## Resource caps

Enforced in the service layer (UI shows them but is not the source of truth):

| Resource | Cap |
|---|---|
| Projects per demo user | 2 (1 pre-seeded + 1 user-created) |
| Seeded emails per project | 5 |
| Injected emails per project | 20 |

On cap breach, service returns `403` with a message like `"Demo accounts are limited to 2 projects. Sign up to create more."`.

## Seeding

At demo creation, the seeder creates:

- **Project:** `demo-inbox` (slug), name `Demo Inbox`, description explaining this is a demo.
- **5 sample emails** in that project:
  1. Welcome / onboarding email (plain text + HTML)
  2. Password reset (HTML with button)
  3. Order receipt (HTML with table)
  4. Newsletter (rich HTML)
  5. Email with PDF attachment (to exercise attachment viewer)

All sample emails use clearly-fake content: `noreply@example.com` senders, links pointing to `#`, no real URLs or tracking. No secrets, no PII.

## Inject-test-email feature

Demo users see an "Inject test email" button on any project view. It calls `POST /api/projects/:id/demo/inject-email` which:

- Verifies caller is demo (`req.user.isDemo`).
- Verifies the project belongs to the caller.
- Verifies the injected-count cap hasn't been hit.
- Picks a random template from a pool of ~10 realistic fake emails and writes it to the `emails` table as if received.

This route is also available to demo users for projects they create themselves, so the "create a project" demo flow ends with visible emails arriving.

## UI

- **Login page**: adds "Try Demo" button next to the login form.
- **Dashboard banner** (only when `user.isDemo`): shows "Demo expires in 0h 57m — sign up to keep your data." Live countdown, dismissible per session but re-shown on reload. Countdown is derived from `user.createdAt + 1h` served by `/api/auth/me`.
- **Blocked actions**: UI disables or hides buttons for blocked routes and shows a tooltip "Not available in demo mode." Server still enforces.
- **Cap indicators**: project list shows `1/2 projects used` for demo users.

## TTL and cleanup

**Cron job** runs every 5 minutes in the API:

```
DELETE FROM users WHERE is_demo = TRUE AND created_at < NOW() - INTERVAL '1 hour'
```

Via Prisma (not raw SQL) so cascade deletes run for `RefreshToken`, `Project`, `Email`, `Attachment`. Idempotent. Logs the count of users deleted, no PII.

Implementation: `@nestjs/schedule` with `@Cron('*/5 * * * *')` in a new `DemoModule`.

## Environment flag

`DEMO_MODE_ENABLED=true|false` (default `false`).

- When `false`: `/api/auth/demo` returns 404, cleanup cron does not register, "Try Demo" button hidden on the web app.
- When `true`: everything described above is active.

Self-hosters running their own My Dev Deck deployment can opt out of demo mode entirely.

## Extensibility (future tools)

Each tool that has data a demo user should see implements a `DemoSeeder` interface:

```ts
interface DemoSeeder {
  seed(userId: string): Promise<void>;
  getBlockedActions?(): string[]; // optional — route paths to block
}
```

`DemoModule` discovers all `DemoSeeder` providers and runs their `seed(userId)` in sequence on demo creation. Cleanup needs no per-tool hook because Prisma cascade deletes handle it.

DevInbox ships with `DevInboxDemoSeeder`. Future tools (webhooks, file sharing, API mocking) each add their own.

## Security summary

- Passwordless demo accounts → no brute-force / enumeration surface
- Rate-limit (2/IP/hour) → no DB flooding
- Service-layer cap enforcement → client can't bypass
- Blocked routes via guard → no account escalation
- Sample data is clearly-fake → no accidental secret leak in a public repo
- Cascade-delete cleanup → no orphan data, no PII in logs
- Env flag default `false` → self-hosters opt in explicitly
- No real SMTP exposure to anonymous users → no spam relay risk

## Out of scope

- **Landing page.** Separate task. For now "Try Demo" lives on the login page; when the landing page ships it moves there.
- **Converting a demo account to a real account.** Not supported. Users sign up fresh; their demo data is discarded.
- **Demo analytics / conversion tracking.** Can be added later.
- **Real SMTP for demo users (L3).** Explicitly rejected — abuse vector too large.
