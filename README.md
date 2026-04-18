# WatchlistTracker

WatchlistTracker is a mobile-first PWA for tracking shows and movies, with release timelines, nearby theater visibility, news aggregation, and optional push/email alerts.

## What’s in this repo

- **Web app**: Next.js (App Router) in `apps/web`
- **Background workers**: scheduled sync + notification jobs in `services/workers`
- **Shared packages**: `packages/types`, `packages/config`, `packages/ui`
- **Database**: PostgreSQL + Prisma schema/migrations in `prisma`

## Core features

- Account signup/login (NextAuth credentials)
- Watchlist management (movies + series)
- Upcoming release timeline
- Nearby theaters view (provider abstraction; current implementation is a safe stub)
- Franchise news feed (RSS-backed)
- Optional web push + email notifications

## Prerequisites

- Node.js **20+**
- npm
- PostgreSQL database

---

## Quick start (no external API keys)

Use this path if you want a local demo quickly and do **not** want to configure TMDB/Resend/VAPID yet.

### 1) Install dependencies

```bash
npm install
```

### 2) Create env files

```bash
cp .env.example .env
cp .env.example apps/web/.env.local
```

### 3) Set only the minimum required values

Set these in **both** `.env` and `apps/web/.env.local`:

- `DATABASE_URL` (Postgres connection)
- `NEXTAUTH_SECRET` (generate with `openssl rand -base64 32`)
- `NEXTAUTH_URL=http://localhost:3000`
- `NEXT_PUBLIC_APP_URL=http://localhost:3000`

You can leave these blank for this mode:

- `TMDB_API_KEY`
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT`
- `RESEND_API_KEY`
- `EMAIL_FROM`

### 4) Prepare database + seed demo data

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

### 5) Start the app

```bash
npm run dev
```

Open `http://localhost:3000` and sign in with:

- **Email**: `demo@example.com`
- **Password**: `demo1234`

### 6) What works in no-key demo mode

- Login/signup and dashboard navigation
- Viewing seeded watchlist items/releases
- Local DB-backed search + add/remove watchlist entries
- Settings and in-app notification records

### 7) Expected limitations in no-key mode

- No TMDB-powered movie release syncing from workers
- Push/email delivery is not configured
- Theater provider currently returns empty results by design
- If you start workers without VAPID/email config, notification delivery features are not usable

---

## Full demo (with API keys and workers)

Use this path for the complete end-to-end experience.

### 1) Start from the same base setup above

Complete all steps from **Quick start** first.

### 2) Add external provider credentials

In `.env` and `apps/web/.env.local`, set:

- `TMDB_API_KEY` (TMDB v3 API key)
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT` (example: `mailto:admin@yourdomain.com`)
- `RESEND_API_KEY`
- `EMAIL_FROM` (verified sender/domain in Resend)

Generate VAPID keys:

```bash
npx web-push generate-vapid-keys
```

### 3) Run web app + workers

Terminal 1:

```bash
npm run dev
```

Terminal 2:

```bash
npm run workers:dev
```

### 4) Demo checklist (full mode)

1. Sign in as `demo@example.com` / `demo1234`
2. Go to **Settings** and confirm notification preferences
3. Open **Notifications** and enable browser push
4. Keep workers running to sync releases/news and dispatch alerts

---

## Environment variables reference

See `.env.example` for the full list.

| Variable | Needed for no-key demo | Needed for full demo | Notes |
|---|---:|---:|---|
| `DATABASE_URL` | ✅ | ✅ | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | ✅ | ✅ | Generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | ✅ | ✅ | `http://localhost:3000` locally |
| `NEXT_PUBLIC_APP_URL` | ✅ | ✅ | `http://localhost:3000` locally |
| `TMDB_API_KEY` | ⬜ | ✅ | Movie metadata/release sync via TMDB |
| `TVMAZE_BASE_URL` | ⬜ | ⬜ | Optional override; defaults to TVMaze public API |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | ⬜ | ✅ | Web push setup |
| `VAPID_PRIVATE_KEY` | ⬜ | ✅ | Web push setup |
| `VAPID_SUBJECT` | ⬜ | ✅ | Usually a `mailto:` value |
| `RESEND_API_KEY` | ⬜ | ✅ | Email notifications |
| `EMAIL_FROM` | ⬜ | ✅ | Verified sender/domain in Resend |
| `REDIS_URL` | ⬜ | ⬜ | Optional (not wired for MVP path) |
| `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` | ⬜ | ⬜ | Optional observability |

---

## Common scripts

From repo root:

- `npm run dev` — run workspace dev processes via Turbo
- `npm run build` — workspace build
- `npm run lint` — workspace lint
- `npm run type-check` — workspace type checks
- `npm run test` — workspace tests
- `npm run db:generate` — generate Prisma client
- `npm run db:migrate` — run Prisma migrations
- `npm run db:seed` — seed demo user/data
- `npm run db:studio` — open Prisma Studio
- `npm run workers:dev` — start scheduler worker in development

---

## Additional docs

- `docs/architecture.md` — architecture + repo layout
- `docs/data-flow.md` — request/data movement across system
- `docs/provider-decisions.md` — external provider choices + fallbacks
- `docs/runbook.md` — operational runbook

