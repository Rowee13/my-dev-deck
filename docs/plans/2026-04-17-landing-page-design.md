# Landing Page Design

**Date:** 2026-04-17
**Branch:** `feat/landing-page`
**Status:** Design approved, pending implementation plan

## Purpose

Replace the current `/` route (which redirects to `/dashboard`) with a proper landing page that:

- Showcases My Dev Deck as an open-source personal dev tool deck
- Leads users to `Try Demo` as the primary conversion path
- Highlights DevInbox as the first tool in the deck
- Invites community feature suggestions via a live GitHub Discussions wishlist
- Replaces the `Try Demo` button currently on the login page

This is an OSS showcase with a hint of multi-tool pitch — not a roadmap (there are no concrete future features yet), but a wishlist where brainstorming can happen.

## Scope

In scope:

- New landing page at `/`
- Removal of `Try Demo` button from the login page
- "My Dev Deck" wordmark on login page becomes a link back to `/`
- Middleware update to treat `/` as public
- New env vars for GitHub integration

Out of scope:

- Docs site link (docs app not yet deployed)
- Full dark mode across the dashboard
- Authenticated feature voting in-app (deferred; GitHub handles voting)
- SEO beyond basic meta tags and OG image

## Architecture overview

- Next.js 16 App Router, Server Components as default
- Client islands only where interactivity or animation requires it (`'use client'`)
- Framer Motion for scroll-triggered reveals and entrance animations
- GitHub GraphQL API for Discussions data, fetched server-side with 5-minute cache
- No new backend endpoints — the NestJS API is untouched

## File structure

```
apps/web/
├── app/
│   └── (landing)/                      # Route group for layout scoping, no URL segment
│       ├── layout.tsx                  # Header + <main>{children}</main> + Footer
│       └── page.tsx                    # Composes section components
├── components/
│   └── landing/
│       ├── Header.tsx                  # Sticky top bar
│       ├── HeroSection.tsx             # Dark gradient, headline, CTAs
│       ├── ToolShowcaseSection.tsx     # DevInbox card with screenshot
│       ├── ValuePropsSection.tsx       # 3 cards: OSS / self-hostable / growing deck
│       ├── FeatureWishlistSection.tsx  # Server component, fetches GitHub Discussions
│       ├── FeatureWishlistItem.tsx     # Per-item hover effects
│       ├── Footer.tsx                  # Minimal footer
│       ├── TryDemoButton.tsx           # Extracted from login page
│       └── BrowserFrame.tsx            # Decorative frame for screenshot
├── lib/
│   └── github.ts                       # Server-only GraphQL client
└── public/
    └── landing/
        └── devinbox-preview.png        # Static screenshot (captured manually)
```

Modified files:

- `apps/web/proxy.ts` — add `/` to `publicPaths`
- `apps/web/app/login/page.tsx` — remove demo button, make wordmark a link
- `apps/web/.env.example` — add GitHub env vars

## Page composition

**`app/(landing)/layout.tsx`:**

```tsx
import { Header } from '@/components/landing/Header';
import { Footer } from '@/components/landing/Footer';

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
}
```

**`app/(landing)/page.tsx`:**

```tsx
import { HeroSection } from '@/components/landing/HeroSection';
import { ToolShowcaseSection } from '@/components/landing/ToolShowcaseSection';
import { ValuePropsSection } from '@/components/landing/ValuePropsSection';
import { FeatureWishlistSection } from '@/components/landing/FeatureWishlistSection';

export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <ToolShowcaseSection />
      <ValuePropsSection />
      <FeatureWishlistSection />
    </>
  );
}
```

Each section component renders its own `<section>` wrapper.

## Component responsibilities

### `Header.tsx`

- Sticky top, transparent at page top, solid `bg-slate-900/80 backdrop-blur-md` after 50px scroll
- Uses Framer Motion `useScroll` to track position
- Left: "My Dev Deck" wordmark, links to `/`
- Right: `Try Demo` button, `Login` link to `/login`, GitHub icon link to repo
- Mobile: right-side items collapse into a hamburger dropdown

### `HeroSection.tsx`

- Background: `bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950`
- Decorative blurred orbs and/or faint grid pattern overlay (CSS only)
- Headline: **"Your personal dev tool deck"**
- Subhead: one sentence, ~15 words — open source collection of tools built in public
- CTAs: `Try Demo` (primary, blue filled) + `View on GitHub` (outlined, white border, GitHub icon)
- Entrance animation: staggered fade-in-up (headline → subhead +100ms → buttons +200ms)

### `ToolShowcaseSection.tsx`

- Light background
- Section heading: "Tools in the deck"
- One card for DevInbox, 2-column grid on desktop (stacks on mobile):
  - Left column: tool name, short description, "Try DevInbox" micro-CTA
  - Right column: `<BrowserFrame>` wrapping the static screenshot
- Slides up from bottom on scroll into viewport
- Hover lift effect on the card

### `ValuePropsSection.tsx`

- Alternating light background (e.g., `bg-slate-50`)
- Heading: "Why My Dev Deck"
- 3-column grid (1-column on mobile), each card:
  - Icon + heading + 1-2 sentences
  - Cards: **Open source** (MIT-licensed, code on GitHub) / **Self-hostable** (Docker Compose, runs anywhere) / **Growing toolset** (more tools being added; shape it with us)
- Stagger animation — cards fade in 100ms apart as section enters viewport

### `FeatureWishlistSection.tsx`

- Light background (alternates back from value props)
- Heading: "What's next?"
- Intro paragraph explaining this is a community-driven wishlist
- Grid of up to 5 `<FeatureWishlistItem>` components
- Primary CTA: `Submit an idea` deep-links to `github.com/<owner>/<repo>/discussions/new?category=feature-ideas`
- Secondary text link: "See all ideas on GitHub"
- Empty state when no discussions exist or API fails: encouraging message with just the submit CTA

### `FeatureWishlistItem.tsx`

- Client component
- Card layout: title, truncated description (~120 chars), upvote count with icon, comment count with icon
- Entire card is clickable, opens discussion on GitHub in new tab
- Hover: slight lift + border color change to blue-300

### `Footer.tsx`

- Single row, minimal
- Left: © 2026 My Dev Deck • MIT Licensed
- Right: GitHub icon link + Login link

### `TryDemoButton.tsx`

- Client component, extracted from current login page logic
- Props: `variant` (primary / secondary / nav) to control size and color
- Calls `tryDemo()` from `lib/api`
- Handles 429 (rate limit), 404 (demo disabled), and generic errors with inline feedback or toast
- On success: sets frontend `session` cookie, navigates to `/dashboard`

### `BrowserFrame.tsx`

- Purely decorative
- Styled container: rounded corners, subtle shadow, mock browser top bar with traffic-light dots and fake URL
- Children render inside the frame (in this case, the screenshot)

## GitHub Discussions data flow

### `lib/github.ts`

Server-only module (`import 'server-only'`). Exports one function and a type:

```ts
export interface FeatureIdea {
  id: string;
  title: string;
  bodyExcerpt: string;
  url: string;
  upvotes: number;
  commentCount: number;
}

export async function fetchFeatureIdeas(): Promise<FeatureIdea[]>;
```

Implementation:

- Endpoint: `https://api.github.com/graphql`
- GraphQL query fetches the first 5 discussions from the configured category, ordered by creation date descending
- `fetch(..., { next: { revalidate: 300 } })` — Next.js caches for 5 minutes server-side
- Unauthenticated — GitHub public API allows 60 requests per hour per IP; 5-minute cache means we use at most 12 requests per hour
- Always returns an array; never throws (try/catch around fetch, returns `[]` on any failure)
- Truncates body text to ~120 chars for excerpt

### Env vars

Added to `apps/web/.env.example` and `apps/web/.env.local`:

```
GITHUB_REPO_OWNER=Rowee13
GITHUB_REPO_NAME=my-dev-deck
GITHUB_DISCUSSIONS_CATEGORY_ID=DIC_kwDOxxxxxxxxxxxxxxxx
```

Category ID is a one-time lookup via GitHub's GraphQL explorer (see setup guide below).

### Error handling

- Network failure → empty array → empty state UI
- Rate limit (HTTP 429) → empty array → empty state UI
- Missing env vars → empty array → empty state UI
- Malformed response → empty array → empty state UI

No loading state needed because this runs at build/revalidate time, not per-request.

## Styling

### Palette

- Hero background: `bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950`
- Hero text: `text-white` / `text-slate-300` for subhead
- Light sections: `bg-white` and `bg-slate-50` alternating
- Primary CTA: `bg-blue-600 hover:bg-blue-700`
- Secondary CTA (hero): `border border-white/20 hover:border-white/40 hover:bg-white/5`
- Accent/links: `text-blue-600` on light, `text-indigo-400` on dark

### Typography

- Reuse existing `Geist` font loaded in root layout
- Hero headline: `text-5xl md:text-6xl lg:text-7xl font-bold`
- Section headings: `text-3xl md:text-4xl font-bold`
- Body: default

### Accessibility

- All CTAs are real `<a>` or `<button>` — no div-click handlers
- Images have descriptive `alt` text
- Contrast meets WCAG AA (blue-600 on white 4.54:1, white on slate-900 16:1)
- `aria-label` on icon-only links
- Framer Motion auto-respects `prefers-reduced-motion`

### Responsive

- Mobile-first Tailwind
- Hero CTAs stack vertically on mobile
- Tool showcase stacks
- Value props: 3-col → 1-col
- Wishlist: always single-column
- Header right-side collapses to hamburger

## Animation system

### Framer Motion install

```bash
pnpm --filter web add framer-motion
```

### Patterns

1. **Hero entrance** — on mount, staggered fade-in-up:
   ```tsx
   initial={{ opacity: 0, y: 20 }}
   animate={{ opacity: 1, y: 0 }}
   transition={{ duration: 0.6, ease: 'easeOut' }}
   ```

2. **Scroll reveals** — section-level, on intersection:
   ```tsx
   initial={{ opacity: 0, y: 30 }}
   whileInView={{ opacity: 1, y: 0 }}
   viewport={{ once: true, amount: 0.2 }}
   transition={{ duration: 0.5 }}
   ```

3. **Stagger children** — value props cards animate in 100ms apart using parent container with `staggerChildren: 0.1`.

4. **Hover (CSS only)**:
   - Tool card: `hover:shadow-xl hover:-translate-y-1 transition-all duration-300`
   - Wishlist item: `hover:border-blue-300 hover:bg-blue-50/50 transition-colors`
   - Primary CTA: `hover:scale-105 transition-transform`

5. **Hero decoration** — CSS-only animated gradient orbs using `animate-pulse` with long duration, no JS.

6. **Header scroll transition** — Framer Motion `useScroll` tracks `window.scrollY`, toggles transparent vs. solid background.

## Middleware update

`apps/web/proxy.ts`:

```ts
const publicPaths = ['/', '/login', '/setup'];  // ADD '/'
const authPaths = ['/login', '/setup'];          // unchanged — '/' stays browseable when logged in
```

Behavior:

- Logged out visiting `/` → landing page renders (public path)
- Logged in visiting `/` → landing page renders (not in authPaths, so no redirect)
- Logged in visiting `/login` → redirect to `/dashboard` (in authPaths)

## Login page changes

`apps/web/app/login/page.tsx`:

Remove:

- `DEMO_MODE_ENABLED` constant
- `DEMO_UNAVAILABLE_KEY` constant
- `demoLoading`, `demoVisible` state
- `handleTryDemo` function
- `tryDemo` import
- sessionStorage `useEffect`
- Entire demo button JSX block (bottom of form)
- `|| demoLoading` from all `disabled` checks

Add:

- `import Link from 'next/link';`
- Wrap the `<h1>My Dev Deck</h1>` heading in `<Link href="/" className="inline-block hover:opacity-80 transition-opacity">` so the wordmark links to the landing page

## GitHub Discussions setup guide

### Step 1 — Enable Discussions

1. Visit `https://github.com/Rowee13/my-dev-deck/settings`
2. Scroll to "Features"
3. Check "Discussions" → click "Set up discussions"

### Step 2 — Create the "Feature Ideas" category

1. Visit `https://github.com/Rowee13/my-dev-deck/discussions`
2. Click the gear icon next to "Categories"
3. Click "New category"
4. Fill in:
   - **Name:** `Feature Ideas`
   - **Description:** "Suggest new tools or features for My Dev Deck"
   - **Discussion format:** `Open-ended discussion`
   - **Emoji:** 💡 (or any)
5. Click "Create"

### Step 3 — Get the category node ID

Visit `https://docs.github.com/en/graphql/overview/explorer`, sign in with GitHub, and run:

```graphql
query {
  repository(owner: "Rowee13", name: "my-dev-deck") {
    discussionCategories(first: 10) {
      nodes {
        id
        name
        slug
      }
    }
  }
}
```

Find the node where `name` is `"Feature Ideas"` and copy its `id` (format: `DIC_kwDO...`).

### Step 4 — Add env vars

Append to `apps/web/.env.local`:

```
GITHUB_REPO_OWNER=Rowee13
GITHUB_REPO_NAME=my-dev-deck
GITHUB_DISCUSSIONS_CATEGORY_ID=DIC_kwDOxxxxxxxxxxxxxxxx
```

Add placeholders to `apps/web/.env.example`:

```
GITHUB_REPO_OWNER=
GITHUB_REPO_NAME=
GITHUB_DISCUSSIONS_CATEGORY_ID=
```

Add the same vars to Fly.io secrets for production:

```bash
fly secrets set GITHUB_REPO_OWNER=Rowee13 GITHUB_REPO_NAME=my-dev-deck GITHUB_DISCUSSIONS_CATEGORY_ID=DIC_... --app my-dev-deck-web
```

### Step 5 — Seed starter ideas

Create 3-5 discussions in the Feature Ideas category to avoid an empty landing page at launch. Suggested seeds:

- "Snippet Vault — searchable personal code snippets"
- "Regex Playground — test regex patterns with live match highlighting"
- "JSON to TypeScript type converter"
- "Markdown to HTML previewer"
- "Webhook debugger (like DevInbox but for HTTP)"

### Step 6 — Test

```bash
pnpm --filter web dev
```

Visit `http://localhost:4001/`, scroll to the wishlist section. Seed discussions should appear with upvote counts. If empty state shows, check env vars and API response in server logs.

## Testing & quality gates

### Automated

- `pnpm --filter web lint` — must pass
- `pnpm --filter web check-types` — must pass
- No new unit tests planned (content-heavy page; manual QA is the right tool)

### Manual QA checklist

- [ ] `/` loads logged out → full landing page with wishlist
- [ ] `/` loads logged in → full landing page (no redirect)
- [ ] `Try Demo` in hero → `/dashboard` with demo banner + expiration countdown
- [ ] `Try Demo` in header → same as above
- [ ] `View on GitHub` → opens repo in new tab
- [ ] `Login` in header when logged out → `/login`
- [ ] `Login` in header when logged in → redirects to `/dashboard` via middleware
- [ ] `/login` logged out → no `Try Demo` button visible
- [ ] `/login` "My Dev Deck" wordmark → clicks through to `/`
- [ ] Scroll past hero → header transitions transparent → solid with blur
- [ ] Hover tool card → lifts with shadow
- [ ] Hover value props → subtle effect
- [ ] Hover wishlist items → border color change
- [ ] Scroll each section into view → entrance animation plays
- [ ] Resize to mobile width → sections stack, hamburger menu works
- [ ] Disable JS → page content still renders (Server Components)
- [ ] `prefers-reduced-motion: reduce` → animations minimized
- [ ] Tab through page with keyboard → all CTAs focusable in logical order
- [ ] Feature wishlist section shows real discussions from GitHub
- [ ] Disconnect network / set invalid env var → empty state shows, page doesn't crash

## SEO

- Page title: "My Dev Deck — Your personal dev tool deck"
- Meta description: ~150 chars describing the OSS dev tool collection
- Open Graph image: placeholder for now (can be added in a follow-up PR)

## Deployment considerations

- Env vars `GITHUB_REPO_OWNER`, `GITHUB_REPO_NAME`, `GITHUB_DISCUSSIONS_CATEGORY_ID` must be set on Fly.io before landing page deploys, or the wishlist shows empty state permanently
- Static screenshot must be committed to `public/landing/devinbox-preview.png` before deploy
- No database migration needed
- No API changes needed
- Next.js ISR handles cache invalidation automatically via `revalidate: 300`

## Open decisions (deferred)

- OG image design and asset creation — follow-up PR
- Dark mode for dashboard — not in this scope
- In-app feature voting (vs. GitHub-hosted) — deferred, GitHub-hosted is sufficient for current scale
- `sameSite` cookie strategy for cross-site fly.dev — unrelated issue being tracked separately
