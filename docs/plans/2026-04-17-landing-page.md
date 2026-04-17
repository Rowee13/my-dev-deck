# Landing Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a landing page at `/` that showcases My Dev Deck as an OSS dev tool deck, drives the `Try Demo` conversion, highlights DevInbox, and surfaces a live GitHub Discussions feature wishlist.

**Architecture:** Next.js 16 App Router Server Component page at `/`, wrapped in a `(landing)` route group layout with Header + Footer. Client islands (`'use client'`) for interactive and animated pieces. Server-side GitHub GraphQL fetch with 5-minute revalidation caches the feature wishlist. Dark hero + light sections with Framer Motion scroll-triggered animations.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS v4, Framer Motion, GitHub GraphQL API, js-cookie (existing).

**Design doc:** `docs/plans/2026-04-17-landing-page-design.md`

**Testing note:** This is a UI-heavy feature where the "test" is the rendered result. We rely on lint + typecheck after each task, and a full manual QA pass at the end. No unit tests are added for individual components (content-heavy, low logic complexity).

---

## Task 1: Install Framer Motion and wire env vars

**Files:**
- Modify: `apps/web/package.json`
- Modify: `apps/web/.env.example`

**Step 1: Install Framer Motion**

```bash
pnpm --filter web add framer-motion
```

Expected output: `framer-motion` added under `dependencies` in `apps/web/package.json`.

**Step 2: Add env var placeholders**

Append to `apps/web/.env.example`:

```
# GitHub Discussions integration for landing page feature wishlist
GITHUB_REPO_OWNER=
GITHUB_REPO_NAME=
GITHUB_DISCUSSIONS_CATEGORY_ID=
```

**Step 3: Add env vars locally (user does this manually, outside this plan)**

Tell the user to:
1. Follow the setup guide in `docs/plans/2026-04-17-landing-page-design.md` Section "GitHub Discussions setup guide"
2. Populate `apps/web/.env.local` with real values after creating the Discussions category
3. The plan's implementation works even if env vars are empty (renders empty state), so don't block on this

**Step 4: Run typecheck to confirm no regressions**

```bash
pnpm --filter web check-types
```

Expected: PASS.

**Step 5: Commit**

```bash
git add apps/web/package.json apps/web/.env.example pnpm-lock.yaml
git commit -m "chore(web): add framer-motion and github env vars for landing page"
```

---

## Task 2: Create landing route group and layout

**Files:**
- Create: `apps/web/app/(landing)/layout.tsx`
- Create: `apps/web/components/landing/Header.tsx` (minimal stub)
- Create: `apps/web/components/landing/Footer.tsx` (minimal stub)

**Step 1: Create stub Header**

Create `apps/web/components/landing/Header.tsx`:

```tsx
export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center px-6">
      <div className="text-white font-bold">My Dev Deck</div>
    </header>
  );
}
```

**Step 2: Create stub Footer**

Create `apps/web/components/landing/Footer.tsx`:

```tsx
export function Footer() {
  return (
    <footer className="py-8 px-6 text-center text-sm text-gray-500">
      © 2026 My Dev Deck • MIT Licensed
    </footer>
  );
}
```

**Step 3: Create landing layout**

Create `apps/web/app/(landing)/layout.tsx`:

```tsx
import { Header } from '../../components/landing/Header';
import { Footer } from '../../components/landing/Footer';

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
}
```

**Step 4: Run typecheck and lint**

```bash
pnpm --filter web check-types && pnpm --filter web lint
```

Expected: PASS.

**Step 5: Commit**

```bash
git add apps/web/app/\(landing\)/layout.tsx apps/web/components/landing/Header.tsx apps/web/components/landing/Footer.tsx
git commit -m "feat(web): scaffold landing route group with header/footer stubs"
```

---

## Task 3: Replace root page with landing page stub and update middleware

**Files:**
- Delete: `apps/web/app/page.tsx` (current redirect)
- Create: `apps/web/app/(landing)/page.tsx`
- Modify: `apps/web/proxy.ts` line 4

**Step 1: Delete existing root page**

```bash
rm apps/web/app/page.tsx
```

This avoids a route conflict — `app/(landing)/page.tsx` will now serve `/`.

**Step 2: Create new landing page stub**

Create `apps/web/app/(landing)/page.tsx`:

```tsx
export default function LandingPage() {
  return (
    <div className="min-h-screen pt-16">
      <section className="py-24 text-center">
        <h1 className="text-4xl font-bold">Landing page coming soon</h1>
      </section>
    </div>
  );
}
```

**Step 3: Update middleware to allow `/` publicly**

Edit `apps/web/proxy.ts` line 4:

Change:
```ts
const publicPaths = ['/login', '/setup'];
```

To:
```ts
const publicPaths = ['/', '/login', '/setup'];
```

The `authPaths` array stays unchanged. This means logged-in users can visit `/` without being redirected.

**Step 4: Start dev server and manually verify**

```bash
pnpm --filter web dev
```

Visit `http://localhost:4001/` — should see the stub "Landing page coming soon" (both logged in and logged out). Stop the dev server.

**Step 5: Typecheck and lint**

```bash
pnpm --filter web check-types && pnpm --filter web lint
```

Expected: PASS.

**Step 6: Commit**

```bash
git add apps/web/app/page.tsx apps/web/app/\(landing\)/page.tsx apps/web/proxy.ts
git commit -m "feat(web): replace / redirect with landing page stub, make / public"
```

Note: `git add apps/web/app/page.tsx` stages the deletion.

---

## Task 4: Extract TryDemoButton component

**Files:**
- Create: `apps/web/components/landing/TryDemoButton.tsx`

**Step 1: Create the component**

Create `apps/web/components/landing/TryDemoButton.tsx`:

```tsx
'use client';

import { useState } from 'react';
import Cookies from 'js-cookie';
import { tryDemo } from '../../lib/api';

const DEMO_MODE_ENABLED = process.env.NEXT_PUBLIC_DEMO_MODE_ENABLED === 'true';

type Variant = 'primary' | 'secondary' | 'nav';

interface Props {
  variant?: Variant;
  className?: string;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    'px-6 py-3 text-base bg-blue-600 text-white rounded-md hover:bg-blue-700 hover:scale-105 transition-all disabled:opacity-50',
  secondary:
    'px-5 py-2.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50',
  nav: 'px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50',
};

export function TryDemoButton({ variant = 'primary', className = '' }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!DEMO_MODE_ENABLED) return null;

  const handleClick = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await tryDemo();
      if (res.status === 201 || res.ok) {
        Cookies.set('session', 'active', { path: '/', expires: 1 });
        window.location.href = '/dashboard';
        return;
      }
      if (res.status === 429) {
        setError('Demo limit reached, try again later.');
        return;
      }
      if (res.status === 404) {
        setError('Demo is not available right now.');
        return;
      }
      let message = 'Could not start demo. Please try again.';
      try {
        const body = await res.json();
        if (body?.message) message = body.message;
      } catch {
        // ignore
      }
      setError(message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start demo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={VARIANT_CLASSES[variant]}
      >
        {loading ? 'Starting demo...' : 'Try Demo'}
      </button>
      {error && (
        <p className="mt-2 text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}
```

**Step 2: Typecheck and lint**

```bash
pnpm --filter web check-types && pnpm --filter web lint
```

Expected: PASS.

**Step 3: Commit**

```bash
git add apps/web/components/landing/TryDemoButton.tsx
git commit -m "feat(web): add reusable TryDemoButton for landing page"
```

---

## Task 5: Build Header with scroll transition and nav links

**Files:**
- Modify: `apps/web/components/landing/Header.tsx` (rewrite)

**Step 1: Rewrite Header as a client component with scroll state and mobile menu**

Replace contents of `apps/web/components/landing/Header.tsx`:

```tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TryDemoButton } from './TryDemoButton';

const GITHUB_URL = 'https://github.com/Rowee13/my-dev-deck';

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-slate-900/80 backdrop-blur-md border-b border-white/10'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="text-white font-bold text-lg hover:opacity-80 transition-opacity"
        >
          My Dev Deck
        </Link>

        <div className="hidden md:flex items-center gap-4">
          <TryDemoButton variant="nav" />
          <Link
            href="/login"
            className="text-sm text-white/80 hover:text-white transition-colors"
          >
            Login
          </Link>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View on GitHub"
            className="text-white/80 hover:text-white transition-colors"
          >
            <GitHubIcon />
          </a>
        </div>

        <button
          type="button"
          className="md:hidden text-white p-2"
          aria-label="Toggle menu"
          onClick={() => setMobileOpen((v) => !v)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {mobileOpen ? (
              <path d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-slate-900/95 backdrop-blur-md border-t border-white/10">
          <div className="px-6 py-4 flex flex-col gap-4">
            <TryDemoButton variant="nav" />
            <Link
              href="/login"
              className="text-white/80 hover:text-white transition-colors"
            >
              Login
            </Link>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/80 hover:text-white transition-colors flex items-center gap-2"
            >
              <GitHubIcon />
              GitHub
            </a>
          </div>
        </div>
      )}
    </header>
  );
}

function GitHubIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.111.82-.261.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}
```

**Step 2: Run dev server and verify**

```bash
pnpm --filter web dev
```

Visit `/` — header renders transparent at top. Scroll down → transitions to blurred dark. Resize to narrow width → hamburger appears. Click hamburger → menu opens. Stop dev server.

**Step 3: Typecheck and lint**

```bash
pnpm --filter web check-types && pnpm --filter web lint
```

Expected: PASS.

**Step 4: Commit**

```bash
git add apps/web/components/landing/Header.tsx
git commit -m "feat(web): build landing header with scroll transition and mobile menu"
```

---

## Task 6: Build HeroSection

**Files:**
- Create: `apps/web/components/landing/HeroSection.tsx`
- Modify: `apps/web/app/(landing)/page.tsx`

**Step 1: Create HeroSection**

Create `apps/web/components/landing/HeroSection.tsx`:

```tsx
'use client';

import { motion } from 'framer-motion';
import { TryDemoButton } from './TryDemoButton';

const GITHUB_URL = 'https://github.com/Rowee13/my-dev-deck';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 min-h-screen flex items-center justify-center px-6">
      {/* Decorative gradient orbs */}
      <div
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"
        style={{ animationDuration: '8s' }}
        aria-hidden="true"
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse"
        style={{ animationDuration: '10s' }}
        aria-hidden="true"
      />

      <div className="relative max-w-4xl mx-auto text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6"
        >
          Your personal dev tool deck
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
          className="text-lg md:text-xl text-slate-300 mb-10 max-w-2xl mx-auto"
        >
          An open-source, self-hostable collection of developer tools — built in public, shaped by the community.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <TryDemoButton variant="primary" />
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 text-base border border-white/20 hover:border-white/40 hover:bg-white/5 text-white rounded-md transition-all flex items-center gap-2"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.111.82-.261.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
            </svg>
            View on GitHub
          </a>
        </motion.div>
      </div>
    </section>
  );
}
```

**Step 2: Wire into page**

Replace `apps/web/app/(landing)/page.tsx` contents:

```tsx
import { HeroSection } from '../../components/landing/HeroSection';

export default function LandingPage() {
  return (
    <>
      <HeroSection />
    </>
  );
}
```

**Step 3: Start dev server and verify**

```bash
pnpm --filter web dev
```

Visit `/`. Expected: dark gradient hero fills viewport, headline + subhead + two CTAs fade in in sequence. Orbs pulse. Stop dev server.

**Step 4: Typecheck and lint**

```bash
pnpm --filter web check-types && pnpm --filter web lint
```

Expected: PASS.

**Step 5: Commit**

```bash
git add apps/web/components/landing/HeroSection.tsx apps/web/app/\(landing\)/page.tsx
git commit -m "feat(web): build landing hero section with CTAs and entrance animation"
```

---

## Task 7: Build BrowserFrame and ToolShowcaseSection

**Files:**
- Create: `apps/web/components/landing/BrowserFrame.tsx`
- Create: `apps/web/components/landing/ToolShowcaseSection.tsx`
- Create: `apps/web/public/landing/devinbox-preview.png` (placeholder, user captures real screenshot later)
- Modify: `apps/web/app/(landing)/page.tsx`

**Step 1: Create BrowserFrame**

Create `apps/web/components/landing/BrowserFrame.tsx`:

```tsx
interface Props {
  children: React.ReactNode;
  url?: string;
}

export function BrowserFrame({ children, url = 'devinbox.mydevdeck.com' }: Props) {
  return (
    <div className="rounded-xl overflow-hidden shadow-2xl ring-1 ring-black/5 bg-white">
      <div className="flex items-center gap-2 px-4 py-3 bg-gray-100 border-b border-gray-200">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 mx-4">
          <div className="px-3 py-1 bg-white rounded text-xs text-gray-500 text-center max-w-sm mx-auto">
            {url}
          </div>
        </div>
      </div>
      <div>{children}</div>
    </div>
  );
}
```

**Step 2: Add placeholder screenshot**

Create `apps/web/public/landing/` directory and add a placeholder `devinbox-preview.png`. For now, commit a text placeholder or a generic preview image. The user will replace with a real screenshot during manual QA.

```bash
mkdir -p apps/web/public/landing
```

Then use a placeholder image (for example, copy an existing image from the project or generate a 1280x800 solid-color PNG as placeholder). Document this as a follow-up in the task commit message.

**Step 3: Create ToolShowcaseSection**

Create `apps/web/components/landing/ToolShowcaseSection.tsx`:

```tsx
'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { BrowserFrame } from './BrowserFrame';

export function ToolShowcaseSection() {
  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Tools in the deck
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            A growing collection of utilities for everyday development work.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}
          className="grid md:grid-cols-2 gap-12 items-center bg-slate-50 rounded-2xl p-8 md:p-12 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
        >
          <div>
            <div className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full mb-4">
              Tool #1
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              DevInbox
            </h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              A self-hosted email testing inbox. Route your app&apos;s transactional emails to DevInbox during development, inspect message content, headers, and attachments, and verify user signup flows without spamming real mailboxes.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              Try DevInbox
              <span aria-hidden="true">→</span>
            </Link>
          </div>

          <BrowserFrame>
            <div className="relative aspect-[16/10]">
              <Image
                src="/landing/devinbox-preview.png"
                alt="DevInbox dashboard showing a list of received emails"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </BrowserFrame>
        </motion.div>
      </div>
    </section>
  );
}
```

**Step 4: Wire into page**

Update `apps/web/app/(landing)/page.tsx`:

```tsx
import { HeroSection } from '../../components/landing/HeroSection';
import { ToolShowcaseSection } from '../../components/landing/ToolShowcaseSection';

export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <ToolShowcaseSection />
    </>
  );
}
```

**Step 5: Start dev server and verify**

Visit `/`. Scroll past hero. Tool showcase section fades in. Card hover lifts. Image displays (or shows placeholder/broken icon until a real screenshot is added). Stop dev server.

**Step 6: Typecheck and lint**

```bash
pnpm --filter web check-types && pnpm --filter web lint
```

Expected: PASS.

**Step 7: Commit**

```bash
git add apps/web/components/landing/BrowserFrame.tsx apps/web/components/landing/ToolShowcaseSection.tsx apps/web/app/\(landing\)/page.tsx apps/web/public/landing/
git commit -m "feat(web): add tool showcase section with browser-framed devinbox preview"
```

---

## Task 8: Build ValuePropsSection

**Files:**
- Create: `apps/web/components/landing/ValuePropsSection.tsx`
- Modify: `apps/web/app/(landing)/page.tsx`

**Step 1: Create ValuePropsSection**

Create `apps/web/components/landing/ValuePropsSection.tsx`:

```tsx
'use client';

import { motion } from 'framer-motion';

const VALUE_PROPS = [
  {
    icon: '📜',
    title: 'Open source',
    description: 'MIT-licensed. Every line of code is on GitHub. Fork it, audit it, contribute back.',
  },
  {
    icon: '🏠',
    title: 'Self-hostable',
    description: 'Docker Compose runs the whole stack locally or on your own server. Your data stays yours.',
  },
  {
    icon: '🧰',
    title: 'Growing toolset',
    description: 'More tools are added over time. Suggest features, upvote what matters, shape the deck with us.',
  },
];

export function ValuePropsSection() {
  return (
    <section className="py-24 px-6 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Why My Dev Deck
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.1 } },
          }}
          className="grid md:grid-cols-3 gap-8"
        >
          {VALUE_PROPS.map((prop) => (
            <motion.div
              key={prop.title}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-xl p-8 border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all"
            >
              <div className="text-4xl mb-4" aria-hidden="true">
                {prop.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {prop.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">{prop.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
```

**Step 2: Wire into page**

Update `apps/web/app/(landing)/page.tsx`:

```tsx
import { HeroSection } from '../../components/landing/HeroSection';
import { ToolShowcaseSection } from '../../components/landing/ToolShowcaseSection';
import { ValuePropsSection } from '../../components/landing/ValuePropsSection';

export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <ToolShowcaseSection />
      <ValuePropsSection />
    </>
  );
}
```

**Step 3: Start dev server and verify**

Scroll to value props section. Three cards fade in with 100ms stagger. Hover borders turn blue with shadow. Stop dev server.

**Step 4: Typecheck and lint**

```bash
pnpm --filter web check-types && pnpm --filter web lint
```

Expected: PASS.

**Step 5: Commit**

```bash
git add apps/web/components/landing/ValuePropsSection.tsx apps/web/app/\(landing\)/page.tsx
git commit -m "feat(web): add value props section with staggered reveal animation"
```

---

## Task 9: Build GitHub Discussions server client

**Files:**
- Create: `apps/web/lib/github.ts`

**Step 1: Create the server-only module**

Create `apps/web/lib/github.ts`:

```ts
import 'server-only';

export interface FeatureIdea {
  id: string;
  title: string;
  bodyExcerpt: string;
  url: string;
  upvotes: number;
  commentCount: number;
}

interface DiscussionNode {
  id: string;
  title: string;
  bodyText: string;
  url: string;
  upvoteCount: number;
  comments: { totalCount: number };
}

interface GraphQLResponse {
  data?: {
    repository?: {
      discussions?: {
        nodes?: DiscussionNode[];
      };
    };
  };
  errors?: unknown;
}

const GITHUB_GRAPHQL = 'https://api.github.com/graphql';
const EXCERPT_LENGTH = 120;
const REVALIDATE_SECONDS = 300; // 5 minutes

const QUERY = `
  query ($owner: String!, $name: String!, $category: ID!) {
    repository(owner: $owner, name: $name) {
      discussions(first: 5, categoryId: $category, orderBy: { field: CREATED_AT, direction: DESC }) {
        nodes {
          id
          title
          bodyText
          url
          upvoteCount
          comments { totalCount }
        }
      }
    }
  }
`;

function excerpt(text: string): string {
  const cleaned = text.trim().replace(/\s+/g, ' ');
  if (cleaned.length <= EXCERPT_LENGTH) return cleaned;
  return cleaned.slice(0, EXCERPT_LENGTH).trimEnd() + '…';
}

export async function fetchFeatureIdeas(): Promise<FeatureIdea[]> {
  const owner = process.env.GITHUB_REPO_OWNER;
  const name = process.env.GITHUB_REPO_NAME;
  const category = process.env.GITHUB_DISCUSSIONS_CATEGORY_ID;

  if (!owner || !name || !category) return [];

  try {
    const res = await fetch(GITHUB_GRAPHQL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        query: QUERY,
        variables: { owner, name, category },
      }),
      next: { revalidate: REVALIDATE_SECONDS },
    });

    if (!res.ok) {
      console.error('[github] discussions fetch failed', res.status);
      return [];
    }

    const json = (await res.json()) as GraphQLResponse;
    if (json.errors) {
      console.error('[github] discussions GraphQL errors', json.errors);
      return [];
    }

    const nodes = json.data?.repository?.discussions?.nodes ?? [];
    return nodes.map((n) => ({
      id: n.id,
      title: n.title,
      bodyExcerpt: excerpt(n.bodyText ?? ''),
      url: n.url,
      upvotes: n.upvoteCount,
      commentCount: n.comments.totalCount,
    }));
  } catch (err) {
    console.error('[github] discussions fetch error', err);
    return [];
  }
}
```

**Step 2: Typecheck and lint**

```bash
pnpm --filter web check-types && pnpm --filter web lint
```

Expected: PASS.

**Step 3: Commit**

```bash
git add apps/web/lib/github.ts
git commit -m "feat(web): add github discussions graphql client for feature wishlist"
```

---

## Task 10: Build FeatureWishlistItem

**Files:**
- Create: `apps/web/components/landing/FeatureWishlistItem.tsx`

**Step 1: Create the component**

Create `apps/web/components/landing/FeatureWishlistItem.tsx`:

```tsx
'use client';

import type { FeatureIdea } from '../../lib/github';

interface Props {
  idea: FeatureIdea;
}

export function FeatureWishlistItem({ idea }: Props) {
  return (
    <a
      href={idea.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-6 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 hover:-translate-y-0.5 transition-all duration-200"
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">
        {idea.title}
      </h3>
      {idea.bodyExcerpt && (
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {idea.bodyExcerpt}
        </p>
      )}
      <div className="flex items-center gap-4 text-sm text-gray-500">
        <span className="flex items-center gap-1">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
          </svg>
          {idea.upvotes}
        </span>
        <span className="flex items-center gap-1">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          {idea.commentCount}
        </span>
      </div>
    </a>
  );
}
```

**Step 2: Typecheck and lint**

```bash
pnpm --filter web check-types && pnpm --filter web lint
```

Expected: PASS.

**Step 3: Commit**

```bash
git add apps/web/components/landing/FeatureWishlistItem.tsx
git commit -m "feat(web): add feature wishlist item card component"
```

---

## Task 11: Build FeatureWishlistSection

**Files:**
- Create: `apps/web/components/landing/FeatureWishlistSection.tsx`
- Modify: `apps/web/app/(landing)/page.tsx`

**Step 1: Create the server component**

Create `apps/web/components/landing/FeatureWishlistSection.tsx`:

```tsx
import { fetchFeatureIdeas } from '../../lib/github';
import { FeatureWishlistItem } from './FeatureWishlistItem';

function getRepoUrl(): string {
  const owner = process.env.GITHUB_REPO_OWNER || 'Rowee13';
  const name = process.env.GITHUB_REPO_NAME || 'my-dev-deck';
  return `https://github.com/${owner}/${name}`;
}

export async function FeatureWishlistSection() {
  const ideas = await fetchFeatureIdeas();
  const repoUrl = getRepoUrl();
  const submitUrl = `${repoUrl}/discussions/new?category=feature-ideas`;
  const allUrl = `${repoUrl}/discussions`;

  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            What&apos;s next?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            A community-driven wishlist. Upvote the ideas you want, or submit your own on GitHub.
          </p>
        </div>

        {ideas.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-4 mb-10">
            {ideas.map((idea) => (
              <FeatureWishlistItem key={idea.id} idea={idea} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 mb-10 bg-slate-50 rounded-xl border border-gray-200">
            <p className="text-gray-600 mb-2">No ideas yet.</p>
            <p className="text-sm text-gray-500">
              Be the first to share what you&apos;d like to see added to the deck.
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <a
            href={submitUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 hover:scale-105 transition-all"
          >
            Submit an idea
          </a>
          <a
            href={allUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
          >
            See all ideas on GitHub →
          </a>
        </div>
      </div>
    </section>
  );
}
```

**Step 2: Wire into page**

Update `apps/web/app/(landing)/page.tsx`:

```tsx
import { HeroSection } from '../../components/landing/HeroSection';
import { ToolShowcaseSection } from '../../components/landing/ToolShowcaseSection';
import { ValuePropsSection } from '../../components/landing/ValuePropsSection';
import { FeatureWishlistSection } from '../../components/landing/FeatureWishlistSection';

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

**Step 3: Start dev server and verify**

Without GitHub env vars populated, visit `/` and scroll to the wishlist section. Should see the empty state + Submit/See all links. Stop dev server.

**Step 4: Typecheck and lint**

```bash
pnpm --filter web check-types && pnpm --filter web lint
```

Expected: PASS.

**Step 5: Commit**

```bash
git add apps/web/components/landing/FeatureWishlistSection.tsx apps/web/app/\(landing\)/page.tsx
git commit -m "feat(web): add feature wishlist section with github discussions fetch"
```

---

## Task 12: Finalize Footer

**Files:**
- Modify: `apps/web/components/landing/Footer.tsx` (rewrite)

**Step 1: Rewrite Footer with real links**

Replace `apps/web/components/landing/Footer.tsx`:

```tsx
import Link from 'next/link';

const GITHUB_URL = 'https://github.com/Rowee13/my-dev-deck';

export function Footer() {
  return (
    <footer className="py-8 px-6 border-t border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-gray-500">
          © 2026 My Dev Deck • MIT Licensed
        </p>
        <div className="flex items-center gap-6">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View on GitHub"
            className="text-gray-500 hover:text-gray-900 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.111.82-.261.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
            </svg>
          </a>
          <Link
            href="/login"
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            Login
          </Link>
        </div>
      </div>
    </footer>
  );
}
```

**Step 2: Typecheck and lint**

```bash
pnpm --filter web check-types && pnpm --filter web lint
```

Expected: PASS.

**Step 3: Commit**

```bash
git add apps/web/components/landing/Footer.tsx
git commit -m "feat(web): finalize landing footer with github and login links"
```

---

## Task 13: Remove demo button from login page and link wordmark to `/`

**Files:**
- Modify: `apps/web/app/login/page.tsx`

**Step 1: Rewrite the login page**

Replace `apps/web/app/login/page.tsx` contents:

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <Link
          href="/"
          className="inline-block mb-2 hover:opacity-80 transition-opacity"
        >
          <h1 className="text-3xl font-bold text-gray-900">My Dev Deck</h1>
        </Link>
        <p className="text-gray-600 mb-6">Sign in to access your developer tools</p>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              required
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              required
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

**Step 2: Start dev server and verify**

```bash
pnpm --filter web dev
```

Visit `/login`. Expected:
- No "Try Demo" button at bottom of card
- "My Dev Deck" heading is a clickable link → takes you to `/`
- Login form works normally

Stop dev server.

**Step 3: Typecheck and lint**

```bash
pnpm --filter web check-types && pnpm --filter web lint
```

Expected: PASS.

**Step 4: Commit**

```bash
git add apps/web/app/login/page.tsx
git commit -m "feat(web): remove demo button from login, link wordmark to landing"
```

---

## Task 14: Add page metadata

**Files:**
- Modify: `apps/web/app/(landing)/layout.tsx`

**Step 1: Add metadata export**

Update `apps/web/app/(landing)/layout.tsx`:

```tsx
import type { Metadata } from 'next';
import { Header } from '../../components/landing/Header';
import { Footer } from '../../components/landing/Footer';

export const metadata: Metadata = {
  title: 'My Dev Deck — Your personal dev tool deck',
  description:
    'An open-source, self-hostable collection of developer tools. Built in public, shaped by the community. Try the demo or explore on GitHub.',
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
}
```

**Step 2: Typecheck and lint**

```bash
pnpm --filter web check-types && pnpm --filter web lint
```

Expected: PASS.

**Step 3: Commit**

```bash
git add apps/web/app/\(landing\)/layout.tsx
git commit -m "feat(web): add landing page metadata for seo"
```

---

## Task 15: Full manual QA pass

**Goal:** Walk through the QA checklist from the design doc before opening a PR.

**Step 1: Ensure env vars are populated (if seed discussions exist)**

If the user has completed the GitHub Discussions setup guide and seeded ideas, confirm `apps/web/.env.local` has all three `GITHUB_*` vars filled in. Otherwise the wishlist will show empty state — that's also a valid scenario to verify.

**Step 2: Replace placeholder screenshot with a real one**

1. Start dev server and navigate to DevInbox dashboard with sample data
2. Take a screenshot of the inbox view (1280×800 recommended)
3. Save as `apps/web/public/landing/devinbox-preview.png`, replacing the placeholder
4. Commit separately:

```bash
git add apps/web/public/landing/devinbox-preview.png
git commit -m "chore(web): add real devinbox preview screenshot for landing page"
```

**Step 3: Run the full QA checklist**

Start dev server:

```bash
pnpm --filter web dev
```

Walk through every item from the design doc's QA checklist:

- [ ] `/` logged out → full landing with wishlist
- [ ] `/` logged in → full landing (no redirect)
- [ ] `Try Demo` in hero → `/dashboard` with banner + expiration
- [ ] `Try Demo` in header → same as above
- [ ] `View on GitHub` → repo in new tab
- [ ] `Login` link (logged out) → `/login`
- [ ] `Login` link (logged in) → redirects to `/dashboard` via middleware
- [ ] `/login` logged out → no Try Demo button
- [ ] `/login` wordmark → clicks through to `/`
- [ ] Scroll → header transitions transparent → solid blur
- [ ] Hover tool card → lifts with shadow
- [ ] Hover value props → border turns blue with shadow
- [ ] Hover wishlist items → border turns blue, lifts slightly
- [ ] Scroll each section into view → entrance animation plays
- [ ] Resize to mobile → sections stack, hamburger works
- [ ] Disable JS → page content still renders (Server Components)
- [ ] System `prefers-reduced-motion: reduce` → animations minimized
- [ ] Tab with keyboard → all CTAs focusable in logical order
- [ ] Wishlist shows real discussions (if env vars set) or empty state
- [ ] Temporarily set invalid `GITHUB_DISCUSSIONS_CATEGORY_ID` → empty state shows, page doesn't crash

**Step 4: Fix any issues found**

Address bugs surfaced by the QA pass in additional commits. Keep each fix focused (1-3 lines of change per commit where possible).

**Step 5: Final lint, typecheck, and build**

```bash
pnpm --filter web lint
pnpm --filter web check-types
pnpm --filter web build
```

All must PASS. Build confirms production bundle works (this catches issues Framer Motion might have with RSC boundaries).

**Step 6: Push branch and open PR**

```bash
git push -u origin feat/landing-page
```

Then open a PR from `feat/landing-page` → `main` with this description:

```
## Summary
- Replace / redirect with a landing page (dark hero, light sections)
- Move Try Demo CTA from login page to landing hero + nav
- Add GitHub Discussions-backed feature wishlist (5-min server cache)
- Make login page wordmark a link back to /
- Make / publicly accessible via middleware update

## Test plan
- [ ] Landing page renders logged out and logged in
- [ ] Try Demo button still works from hero and header
- [ ] Login page has no Try Demo button
- [ ] Login page wordmark links to /
- [ ] Feature wishlist fetches real GitHub Discussions (or shows empty state)
- [ ] All animations and hover effects work
- [ ] Mobile layout stacks correctly
```

---

## Summary

15 tasks, each ~2-10 minutes of implementation:

1. Install Framer Motion + env vars
2. Landing route group + layout + stubs
3. Replace root page + middleware update
4. TryDemoButton component
5. Header with scroll transition + mobile menu
6. HeroSection
7. BrowserFrame + ToolShowcaseSection
8. ValuePropsSection
9. GitHub GraphQL client
10. FeatureWishlistItem
11. FeatureWishlistSection
12. Finalize Footer
13. Clean up login page
14. Page metadata
15. Manual QA + screenshot + PR

Total estimated commits: ~16 (one per task + extra for screenshot + any QA fixes).
