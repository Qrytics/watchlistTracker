# Architecture Overview — WatchlistTracker

## What is this?

WatchlistTracker is a mobile-first Progressive Web App (PWA) that lets users:

- Track TV series and movies they care about
- Receive alerts when new episodes air or movies release
- See nearby theatre showings for watched movies
- Read franchise news and social updates in one feed

Users bookmark the website to their phone home screen. The site behaves like a native app (full-screen, installable, offline-capable) via the Web App Manifest and Service Worker.

---

## Repository Layout

```
watchlistTracker/
├── apps/
│   └── web/                   Next.js PWA — the entire user-facing product
│       ├── app/               Next.js App Router pages and API routes
│       │   ├── (auth)/        Login / signup pages (no nav bar)
│       │   ├── (dashboard)/   Authenticated pages (watchlist, releases, …)
│       │   └── api/           REST API route handlers
│       ├── features/          One folder per product feature
│       │   ├── auth/          Login form, signup form, session provider
│       │   ├── watchlist/     Watchlist page, search bar, cards
│       │   ├── releases/      Episodes + movie release timeline
│       │   ├── theaters/      Nearby showings list
│       │   ├── news/          RSS feed reader
│       │   ├── notifications/ Notification history + push toggle
│       │   └── settings/      Preferences, location, account
│       ├── components/        Shared layout components (TopBar, BottomNav, SW)
│       ├── lib/               Infra-level utilities
│       │   ├── auth/          NextAuth config, session helpers
│       │   ├── db/            Prisma client singleton
│       │   ├── push/          Web Push sender + React hook
│       │   ├── email/         Resend email sender + HTML templates
│       │   └── utils/         Geo distance (Haversine)
│       ├── public/            Static assets (manifest, service worker, icons)
│       └── styles/            Global CSS (Tailwind base + custom)
├── packages/
│   ├── types/                 Shared TypeScript types (no Prisma, browser-safe)
│   ├── config/                App-wide constants (intervals, sizes, URLs)
│   └── ui/                    Shared presentational React components
├── services/
│   ├── providers/             External API clients
│   │   ├── tmdb.ts            TMDB v3 — movies, series, release dates
│   │   ├── tvmaze.ts          TVMaze — episodes, air dates
│   │   ├── theaters.ts        Theater showings (provider abstraction)
│   │   └── feeds.ts           RSS aggregator
│   └── workers/               Background jobs
│       ├── sync-releases.ts   Sync episodes + movie releases from APIs
│       ├── sync-news.ts       Fetch and store RSS items
│       ├── sync-theaters.ts   Fetch nearby showings for user locations
│       ├── send-notifications.ts  Dispatch push/email alerts
│       └── scheduler.ts       node-cron wiring for all jobs
├── prisma/
│   ├── schema.prisma          Database schema (single source of truth)
│   └── seed.ts                Demo data for local development
└── docs/                      This documentation
    ├── architecture.md        (this file)
    ├── data-flow.md           How data moves through the system
    ├── provider-decisions.md  Why each external API was chosen
    ├── runbook.md             Operations guide
    └── adr/                   Architecture Decision Records
```

---

## Tech Stack

| Concern | Technology | Why |
|---|---|---|
| Frontend / routing | Next.js 15 (App Router) | SSR, file-based routing, API routes in one repo |
| Language | TypeScript | Type safety across frontend and backend |
| Styling | Tailwind CSS | Mobile-first utility classes, fast iteration |
| PWA | Web App Manifest + Service Worker | Install-to-home-screen, offline, push |
| Auth | NextAuth v4 | Credentials + OAuth, Prisma adapter, JWT sessions |
| Database | PostgreSQL + Prisma | Relational, strong typing, migrations |
| Caching | Redis (future) | Rate limiting, response caching for API routes |
| Push notifications | web-push (VAPID) | Native browser push, no third-party SDK |
| Email | Resend | Transactional email fallback |
| Background jobs | node-cron | Lightweight cron scheduler for the workers process |
| TV episode data | TVMaze API | Free, no key required, rich episode metadata |
| Movie / series metadata | TMDB API | Industry standard, free tier, images |
| Monorepo | npm workspaces + Turborepo | Shared packages, parallel builds |

---

## Request Flow (Happy Path)

```
Browser → GET /watchlist
    → Next.js App Router (dashboard layout checks session)
    → getServerSession() reads JWT from cookie
    → Renders WatchlistPage (client component)
    → WatchlistPage calls SWR → GET /api/watchlist
    → API route: requireSession() + db.watchlistItem.findMany()
    → Returns JSON { data: [...], error: null }
    → SWR re-renders UI with data
```

---

## Push Notification Flow

```
1. User visits /notifications
2. Clicks "Enable push notifications"
3. Browser asks for permission
4. usePushSubscription hook calls navigator.serviceWorker.ready
   → reg.pushManager.subscribe({ applicationServerKey: VAPID_PUBLIC })
5. Subscription (endpoint + keys) POSTed to /api/push/subscribe
6. Stored in PushSubscription table (linked to user)

Later (background worker):
7. send-notifications worker detects a new episode
8. For each tracking user: sendPush(subscription, payload)
9. web-push library encrypts + sends to browser's push service
10. Service worker receives "push" event → showNotification()
11. User taps notification → notificationclick → opens /releases
```

---

## Worker Process

The `services/workers/scheduler.ts` process runs separately from the Next.js server.
In production, deploy it as a long-running Render/Railway/Heroku worker dyno or a VM cron.

Jobs share the same DATABASE_URL and VAPID credentials as the web app.
They import helpers from `apps/web/lib/` directly (monorepo symlinks).
