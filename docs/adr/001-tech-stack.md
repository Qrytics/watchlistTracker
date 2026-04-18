# ADR 001 — Tech Stack Selection

**Date**: 2026-04-18
**Status**: Accepted

---

## Context

We need to build a mobile-first content tracking app that:
- Works on any phone without requiring an App Store install
- Sends push notifications to users' phones
- Stores user accounts, watchlists, and release data
- Runs background jobs to sync data from external APIs

The system should be easy to operate by a small team and cheap to host.

---

## Decision

### Frontend: Next.js 15 + TypeScript + Tailwind CSS

**Why Next.js?**
- Full-stack in one codebase (pages + API routes).
- App Router enables server components for fast initial loads.
- SSR improves SEO for the landing page.
- Vercel deployment is trivial.

**Why TypeScript?**
- Catches bugs at compile time.
- Shared types between frontend, API, and workers via `packages/types`.

**Why Tailwind?**
- Mobile-first utility classes.
- No CSS file proliferation.
- Tree-shaken in production.

### PWA: Web App Manifest + Custom Service Worker

**Why not a native app?**
- App Store distribution requires developer accounts ($99/yr Apple, $25 Google).
- PWA installed to home screen looks identical to a native app.
- Web Push works on Android natively, and iOS 16.4+ for installed PWAs.

**Why a custom SW instead of next-pwa?**
- Simpler — we only need basic caching and push handling.
- next-pwa adds complexity and has had compatibility issues with the App Router.

### Auth: NextAuth v4

**Why NextAuth?**
- Turnkey credentials provider with bcrypt.
- Prisma adapter for session/account persistence.
- Extensible — adding Google/Discord OAuth later is trivial.

### Database: PostgreSQL + Prisma

**Why PostgreSQL?**
- Relational data fits our schema well (users → watchlist → series/movies → releases).
- Mature, widely supported, free on Supabase.

**Why Prisma?**
- Type-safe queries.
- Migration management.
- Studio UI for browsing data.

### Background Jobs: node-cron (simple process)

**Why not BullMQ / Redis queues?**
- Overkill for MVP. BullMQ requires Redis and a separate worker setup.
- node-cron is zero-dependency and sufficient for scheduled polling.
- Migration path: if job volume grows, switch to BullMQ with the same job functions.

### Email: Resend

**Why Resend over SendGrid/Mailgun?**
- Better TypeScript SDK.
- Generous free tier.
- Simpler API surface.

---

## Consequences

**Positive**
- Fast development velocity — one language (TypeScript) across the stack.
- Low operational overhead — Vercel + Supabase handles scaling.
- Feature-complete PWA experience on day one.

**Negative / Trade-offs**
- iOS push notifications require the user to install the PWA to home screen first.
- node-cron workers must stay running — requires a separate always-on process (Railway/Render).
- No Redis in MVP = no distributed locking between worker instances (run only one worker).
