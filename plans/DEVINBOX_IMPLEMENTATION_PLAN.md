# DevInbox Implementation Plan

## Overview

DevInbox is a Mailinator-like email testing tool for developers. Users can create projects with unique subdomains (e.g., `myproject.devinbox.local`), and any email sent to `anything@myproject.devinbox.local` will be captured and viewable in the dashboard.

## Goal

Provide a self-hosted email testing solution that:
- Allows developers to create projects with unique subdomain identifiers
- Captures all emails sent to any address under that subdomain
- Provides a web dashboard to view and manage emails
- Supports multiple projects per user
- Works in local development without external dependencies

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                    │
│  - Dashboard with sidebar navigation                        │
│  - Project management UI                                    │
│  - Email inbox viewer                                       │
│  - Real-time updates (polling or WebSocket)                 │
└─────────────────────────────────────────────────────────────┘
                              ↓ HTTP API
┌─────────────────────────────────────────────────────────────┐
│                     Backend (NestJS API)                     │
│  - Project CRUD endpoints                                   │
│  - Email retrieval endpoints                                │
│  - Authentication & authorization                           │
│  - Internal SMTP handler                                    │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      SMTP Server                             │
│  - Accepts inbound SMTP connections (port 2525)             │
│  - Parses emails with mailparser                            │
│  - Routes by subdomain (project identifier)                 │
│  - Stores in database                                       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                       │
│  - Users (optional for MVP)                                 │
│  - Projects (subdomain, name, settings)                     │
│  - Emails (from, to, subject, body, attachments)           │
└─────────────────────────────────────────────────────────────┘
```

## Data Model

### Project
```typescript
{
  id: string (uuid)
  slug: string (unique) // e.g., "myproject" for myproject.devinbox.local
  name: string
  description?: string
  createdAt: timestamp
  updatedAt: timestamp
  userId?: string (for future multi-user support)
}
```

### Email
```typescript
{
  id: string (uuid)
  projectId: string (FK)
  from: string
  to: string[] // Can receive multiple recipients
  subject?: string
  bodyText?: string
  bodyHtml?: string
  headers: json
  rawMime?: text
  attachments: Attachment[]
  receivedAt: timestamp
  isRead: boolean
}
```

### Attachment
```typescript
{
  id: string (uuid)
  emailId: string (FK)
  filename: string
  contentType: string
  size: number
  storagePath: string
}
```

## Key Features

### Core Features (MVP)
1. **Project Management**
   - Create project with custom slug
   - List all projects
   - Delete project (and all associated emails)
   - View project details and subdomain

2. **Email Reception**
   - SMTP server accepts emails to `*@{project-slug}.devinbox.local`
   - Parse and store emails with attachments
   - Support HTML and plain text bodies
   - Store full email headers

3. **Email Viewing**
   - List emails for a project (with pagination)
   - View full email details (headers, HTML/text body, attachments)
   - Download attachments
   - Mark emails as read/unread
   - Delete individual emails

4. **Dashboard UI**
   - Sidebar navigation with "Tools" section
   - Project switcher/selector
   - Email list view (inbox-style)
   - Email detail view
   - Responsive design

### Future Enhanations (Post-MVP)
- Search emails by sender, subject, content
- Email forwarding/webhooks
- Multiple users with authentication
- Email sending (outbound SMTP)
- Email filters and rules
- Export emails (JSON, EML format)
- Real-time notifications (WebSocket)
- Custom domain support (beyond .devinbox.local)

---

## Implementation Phases

## Phase 1: Foundation & Database Setup
**Duration: 1-2 days**

### Tasks
1. **Database Setup**
   - [ ] Choose ORM (Prisma recommended for type safety)
   - [ ] Install dependencies: `prisma`, `@prisma/client`
   - [ ] Initialize Prisma in `apps/api`
   - [ ] Create schema for Project, Email, Attachment models
   - [ ] Set up PostgreSQL (Docker compose or local)
   - [ ] Run initial migration

2. **NestJS Module Structure**
   - [ ] Create `projects` module in `apps/api/src/projects/`
   - [ ] Create `emails` module in `apps/api/src/emails/`
   - [ ] Create `smtp` module in `apps/api/src/smtp/`
   - [ ] Set up Prisma service for database access
   - [ ] Configure module imports in AppModule

3. **Environment Configuration**
   - [ ] Add `.env` file with database URL, SMTP port, domain config
   - [ ] Add configuration validation using `@nestjs/config`

### Deliverables
- Database schema defined and migrated
- NestJS modules scaffolded
- Environment configuration working

---

## Phase 2: Backend API - Projects
**Duration: 1-2 days**

### Tasks
1. **Project Service & Controller**
   - [ ] Create ProjectsService with CRUD operations
   - [ ] Implement slug validation (alphanumeric, lowercase, unique)
   - [ ] Create ProjectsController with endpoints:
     - `POST /api/projects` - Create project
     - `GET /api/projects` - List all projects
     - `GET /api/projects/:id` - Get project details
     - `DELETE /api/projects/:id` - Delete project
   - [ ] Add DTOs for request validation (CreateProjectDto, etc.)

2. **Testing**
   - [ ] Write unit tests for ProjectsService
   - [ ] Write e2e tests for project endpoints
   - [ ] Test slug uniqueness and validation

### Deliverables
- Working project management API
- Projects can be created, listed, and deleted
- Tests passing

---

## Phase 3: SMTP Server & Email Storage
**Duration: 2-3 days**

### Tasks
1. **SMTP Server Setup**
   - [ ] Install dependencies: `smtp-server`, `mailparser`
   - [ ] Create SMTPService in `smtp` module
   - [ ] Configure SMTP server to listen on port 2525
   - [ ] Implement RCPT TO validation (check if project slug exists)
   - [ ] Parse incoming emails with mailparser

2. **Email Storage**
   - [ ] Create EmailsService with storage logic
   - [ ] Parse email recipients to extract project slug from domain
   - [ ] Store email metadata, body, and headers
   - [ ] Handle attachments (save to disk/storage)
   - [ ] Create internal endpoint or direct service call from SMTP handler

3. **Email Retrieval API**
   - [ ] Create EmailsController with endpoints:
     - `GET /api/projects/:projectId/emails` - List emails (paginated)
     - `GET /api/projects/:projectId/emails/:emailId` - Get email details
     - `DELETE /api/projects/:projectId/emails/:emailId` - Delete email
     - `GET /api/projects/:projectId/emails/:emailId/attachments/:attachmentId` - Download attachment
     - `PATCH /api/projects/:projectId/emails/:emailId/read` - Mark as read
   - [ ] Implement pagination with cursor or offset
   - [ ] Add email count to project details

4. **Testing**
   - [ ] Create integration test: start SMTP server, send test email via nodemailer
   - [ ] Verify email is stored correctly
   - [ ] Test attachment handling
   - [ ] Test invalid recipient rejection

### Deliverables
- SMTP server receiving and parsing emails
- Emails stored in database with attachments
- Email retrieval API working
- Integration tests passing

---

## Phase 4: Frontend Dashboard - Basic Layout
**Duration: 1-2 days**

### Tasks
1. **Dashboard Layout**
   - [ ] Choose which app (`web` or `docs`) to use for dashboard (recommend `web`)
   - [ ] Install UI dependencies if needed (icons, etc.)
   - [ ] Create dashboard layout with sidebar
   - [ ] Add sidebar navigation with "Tools" section
   - [ ] Add "DevInbox" as first tool in sidebar
   - [ ] Set up routing structure:
     - `/dashboard` - Main dashboard
     - `/dashboard/devinbox` - DevInbox home/projects
     - `/dashboard/devinbox/projects/:projectId` - Project inbox

2. **Shared UI Components**
   - [ ] Create reusable components in `@repo/ui`:
     - Sidebar component
     - Navigation items
     - Page layout wrapper
   - [ ] Set up consistent styling with Tailwind

### Deliverables
- Dashboard layout with sidebar navigation
- Routing structure in place
- Basic UI components created

---

## Phase 5: Frontend - Project Management
**Duration: 1-2 days**

### Tasks
1. **API Client Setup**
   - [ ] Create API client utilities for backend calls
   - [ ] Set up React Query or SWR for data fetching
   - [ ] Configure API base URL (environment variable)

2. **Project List Page**
   - [ ] Create projects list page (`/dashboard/devinbox`)
   - [ ] Display all projects in a grid/list
   - [ ] Show project slug, name, email count
   - [ ] Add "Create Project" button

3. **Create Project Form**
   - [ ] Create modal/page for project creation
   - [ ] Form fields: name, slug (auto-generate from name option)
   - [ ] Slug validation (frontend + backend)
   - [ ] Show success message with subdomain info
   - [ ] Refresh project list after creation

4. **Project Actions**
   - [ ] Add delete project button with confirmation
   - [ ] Add edit project (optional for MVP)

### Deliverables
- Projects can be created via UI
- Projects displayed in dashboard
- Delete functionality working

---

## Phase 6: Frontend - Email Inbox Viewer
**Duration: 2-3 days**

### Tasks
1. **Email List View**
   - [ ] Create inbox page (`/dashboard/devinbox/projects/:projectId`)
   - [ ] Display project info (subdomain, instructions)
   - [ ] Show email list with:
     - From address
     - Subject
     - Date/time received
     - Read/unread indicator
   - [ ] Implement pagination
   - [ ] Add auto-refresh (polling every 5-10 seconds)
   - [ ] Empty state when no emails

2. **Email Detail View**
   - [ ] Create email detail component/modal
   - [ ] Display email headers (from, to, subject, date)
   - [ ] Show HTML body in iframe (sandboxed) or rendered safely
   - [ ] Show plain text body as alternative
   - [ ] List attachments with download links
   - [ ] Add "View Raw" option to see full headers
   - [ ] Mark as read when opened

3. **Email Actions**
   - [ ] Delete email button
   - [ ] Mark as unread button
   - [ ] Download email as .eml file (future)

4. **Polish & UX**
   - [ ] Add loading states
   - [ ] Add error handling and error messages
   - [ ] Responsive design for mobile
   - [ ] Add copy-to-clipboard for email addresses
   - [ ] Add visual feedback for actions

### Deliverables
- Email inbox view showing all emails for a project
- Email detail view with all content
- Actions (delete, mark read) working
- Good UX with loading and error states

---

## Phase 7: Testing & Documentation
**Duration: 1-2 days**

### Tasks
1. **End-to-End Testing**
   - [ ] Test complete flow: create project → send email → view in dashboard
   - [ ] Test multiple projects isolation
   - [ ] Test email with attachments
   - [ ] Test HTML and plain text emails
   - [ ] Test edge cases (large emails, special characters in addresses)

2. **Documentation**
   - [ ] Update CLAUDE.md with DevInbox architecture
   - [ ] Create user guide: how to use DevInbox
   - [ ] Document SMTP server setup (ports, firewall, etc.)
   - [ ] Document how to send test emails (examples with curl, nodemailer)
   - [ ] Add environment variable documentation

3. **Docker Setup (Optional)**
   - [ ] Create docker-compose.yml for PostgreSQL + SMTP
   - [ ] Document local development setup

### Deliverables
- Comprehensive testing completed
- Documentation updated
- Easy setup instructions for new developers

---

## Phase 8: Polish & Production Ready (Optional)
**Duration: 1-2 days**

### Tasks
1. **Performance**
   - [ ] Add database indexes (projectId, receivedAt, etc.)
   - [ ] Implement email cleanup (auto-delete old emails after X days)
   - [ ] Add rate limiting to SMTP server
   - [ ] Optimize email list queries

2. **Security**
   - [ ] Validate email size limits
   - [ ] Sanitize HTML content for XSS prevention
   - [ ] Add authentication (optional for local use, required for hosted)
   - [ ] CORS configuration
   - [ ] Rate limit API endpoints

3. **Deployment**
   - [ ] Production build configuration
   - [ ] Environment-specific configs (development vs production domain)
   - [ ] SSL/TLS for SMTP (optional)
   - [ ] Logging and monitoring setup

### Deliverables
- Production-ready application
- Security measures in place
- Deployment documentation

---

## Technical Decisions

### Database: PostgreSQL + Prisma
- **Why**: Strong TypeScript support, excellent migration system, type-safe queries
- **Alternative**: TypeORM (more NestJS-native but less type-safe)

### Frontend State: React Query / TanStack Query
- **Why**: Excellent caching, auto-refresh, optimistic updates
- **Alternative**: SWR (lighter weight) or plain fetch with useState

### SMTP Library: smtp-server + mailparser
- **Why**: Pure Node.js, no external services, full control
- **Alternative**: Haraka (more features but complex), mailin (simpler but less maintained)

### Real-time Updates: Polling (MVP) → WebSocket (Future)
- **Why**: Polling is simpler for MVP, WebSocket for real-time feel later
- **Implementation**: Use React Query's `refetchInterval` for polling

---

## Environment Variables

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/devdeck"

# SMTP Server
SMTP_PORT=2525
SMTP_DOMAIN="devinbox.local"

# API
API_PORT=3000
NODE_ENV="development"

# Frontend
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

---

## Getting Started (After Implementation)

1. Start PostgreSQL database
2. Run migrations: `pnpm --filter api prisma migrate dev`
3. Start NestJS API: `pnpm --filter api start:dev`
4. Start Next.js dashboard: `pnpm --filter web dev`
5. Send test email:
   ```bash
   # Using SMTP
   telnet localhost 2525
   EHLO test
   MAIL FROM: sender@example.com
   RCPT TO: test@myproject.devinbox.local
   DATA
   Subject: Test Email

   This is a test email.
   .
   QUIT
   ```

---

## Success Criteria

MVP is complete when:
- ✅ User can create a project via dashboard
- ✅ Project gets a unique subdomain (e.g., myproject.devinbox.local)
- ✅ Email sent to any address at that subdomain is received
- ✅ Email appears in dashboard inbox within 10 seconds
- ✅ User can view email details (subject, body, from, to, date)
- ✅ User can download attachments
- ✅ User can delete emails and projects
- ✅ Multiple projects work independently without crosstalk

---

## Estimated Timeline

- **Phase 1**: 1-2 days
- **Phase 2**: 1-2 days
- **Phase 3**: 2-3 days
- **Phase 4**: 1-2 days
- **Phase 5**: 1-2 days
- **Phase 6**: 2-3 days
- **Phase 7**: 1-2 days
- **Phase 8** (optional): 1-2 days

**Total: 10-17 days for full MVP (Phases 1-7)**

---

## Next Steps

1. Review and approve this plan
2. Start with Phase 1: Set up Prisma and database schema
3. Work through phases sequentially or parallelize frontend/backend work
4. Test continuously throughout implementation
