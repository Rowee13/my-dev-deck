# Email Inboxes (MailSlurp-like) — Plan (MVP)

## Goal

Provide a developer-friendly local dev tool that lets users create multiple email inboxes and receive real email deliveries. MVP focuses on receive-only functionality and a stable API so other tools (UI, webhooks, integrations) can be added later.

## Assumptions (MVP)

- This MVP will run in local development and in the `apps/api` service (NestJS) or as a sidecar service.
- We will accept emails via an embedded SMTP receiver (no external paid mail API required).
- Each inbox will map to a unique recipient address (e.g. <inbox-id>@inboxes.local or user-chosen address) and emails routed by recipient.
- Persistence: Postgres (recommended). Use Prisma or TypeORM depending on team preference. Plan will show Prisma examples.
- Auth: simple API-key for inbox management endpoints in MVP. Expand later to OAuth/SSO.

## Contract (inputs/outputs/behavior)

- Create Inbox: POST /inboxes -> returns inbox id, email address, metadata.
- Receive Email: SMTP server accepts inbound SMTP sessions and POSTs parsed message to internal handler which stores the Email for the matched Inbox and emits webhook/event.
- List Emails: GET /inboxes/:id/emails -> paginated list.
- Get Email: GET /inboxes/:id/emails/:emailId -> full MIME, headers, attachments.
- Delete Email: DELETE /inboxes/:id/emails/:emailId

## Core Data Model (proposal)

- Inbox
    - id: uuid
    - address: string (unique) — the recipient address assigned
    - name: string | null
    - createdAt, updatedAt
- Email
    - id: uuid
    - inboxId: uuid (FK)
    - from: string
    - to: string[]
    - subject: string | null
    - bodyText: text | null
    - bodyHtml: text | null
    - headers: json
    - rawMime: text (or stored in object store) — full RFC822 content
    - receivedAt: timestamp
- Attachment
    - id: uuid
    - emailId: uuid (FK)
    - filename: string
    - contentType: string
    - size: int
    - storagePath: string (local or object store)

## High-level architecture

- API (NestJS in `apps/api`)
    - Hosts management endpoints (create/list inboxes, fetch emails)
    - Exposes internal handler to accept parsed inbound emails from the SMTP receiver
- SMTP Receiver (embedded or sidecar)
    - Built with `smtp-server` (Node) or `Haraka`/`mailin` for Node
    - Accepts SMTP, parses MIME (with `mailparser`) and POSTs parsed message to API handler (local function or HTTP endpoint)
    - Single receiver listens on port (e.g., 2525) and routes by recipient to inbox
- Storage
    - Postgres for structured data
    - Local filesystem or S3-compatible store for attachments/raw MIME
- Optional: Event emitter / webhooks
    - On new email, emit events or call inbox-specific webhook configured by the user

## Receiving strategy (MVP)

- Start with an embedded Node SMTP server using `smtp-server`.
    - On DATA, feed the stream to `mailparser` to get structured data and attachments.
    - Determine target inbox by matching recipient address.
    - Persist email and attachments, acknowledge SMTP session.
- This design works for local dev and can be extended to accept inbound traffic via port forwarding or a real domain (via MX pointing) in the future.

## API endpoints (MVP)

- POST /inboxes
    - Create inbox. Body: { name?: string, address?: string } (if address omitted, server generates unique address)
    - Response: { id, address, name, createdAt }
- GET /inboxes
    - List inboxes
- GET /inboxes/:id/emails?limit=...&cursor=...
    - Paginated listing
- GET /inboxes/:id/emails/:emailId
    - Full email payload including headers and download links for attachments
- DELETE /inboxes/:id/emails/:emailId
- Internal webhook/handler used by SMTP side: POST /internal/smtp/deliver
    - Called with parsed message JSON when SMTP server receives email. This endpoint is internal-only or protected and accepts a JSON payload describing `to`, `from`, `subject`, `html`, `text`, `attachments`.

## Security and abuse considerations

- Rate-limit SMTP connections and API endpoints to avoid being used as an open relay or spam sink.
- Accept only RCPT TO addresses that are created inbox addresses or a configurable wildcard.
- For public exposure, require domain verification before accepting external mail for a domain.

## Edge cases & error handling

- Multiple recipients mapping to multiple inboxes: create separate Email records or copy behavior? MVP: create one Email per recipient (store original recipients list) and associate to each matching inbox by copy or reference (store as separate records with same rawMime if desired).
- Large attachments: enforce size limit and stream to object store.
- Invalid MIME: store raw content and error flag.

## Acceptance criteria (MVP)

1. Developer can create an inbox via API and receives an email address.
2. SMTP receiver accepts a message sent to that address and it shows up in GET /inboxes/:id/emails.
3. Attachments are stored and downloadable.
4. Basic tests verifying end-to-end flow (create inbox -> send SMTP message -> read email) pass locally.

## Implementation roadmap (step-by-step)

Phase 1 — design & scaffolding (1–2 days)

- Add plan and update `apps/api` to include a new module `inbox`.
- Add DB schema (Prisma schema or TypeORM entities) for Inbox/Email/Attachment.
- Add configuration for storage and SMTP receiver (port, size limits).
  Phase 2 — SMTP receiver + persistence (2–4 days)
- Implement SMTP receiver service using `smtp-server`.
- Parse MIME with `mailparser` and persist to DB + attachments to disk.
- Implement internal handler endpoints in `apps/api`.
  Phase 3 — API endpoints, listing, retrieval (1–2 days)
- Implement endpoints to create/list inboxes and fetch emails.
- Implement pagination and attachment download endpoints.
  Phase 4 — tests + docs (1–2 days)
- Add integration tests that start the SMTP server, create inbox, send a message (using nodemailer), and assert database state.
- Add README & quickstart.
  Phase 5 — optional improvements
- Add web UI to view inboxes and messages (reuse `web` app or new UI in `ui/`).
- Webhooks per-inbox and event queue (e.g., RabbitMQ, Redis Streams).
- Support sending/replying to emails (SMTP outbound or third-party relays).

Estimated total: 1–2 weeks (MVP partial feature set) depending on parallelization and infra choices.

## Next steps I can take immediately

1. Create DB schema (Prisma or TypeORM) for `Inbox`, `Email`, `Attachment`.
2. Add a NestJS module skeleton in `apps/api` for Inbox service and endpoints.
3. Implement a minimal SMTP receiver that calls internal HTTP handler and a simple integration test.

## Questions / Clarifications (if you want different choices, tell me)

- Do you prefer Prisma or TypeORM/Sequelize for DB access? The repo appears to be TypeScript/NestJS which commonly uses TypeORM but Prisma is also popular.
- Should inbound addresses be generated under a single dev domain (e.g. `inbox.<project>.local`), or do you plan to receive real Internet email for custom domains now?
- Do you want this functionality inside `apps/api` as a new module, or as a separate package/service under `apps/` (e.g., `apps/mail-receiver`)?

File created by: planning step — proceed when you confirm choices above.
