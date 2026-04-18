# Runbook — WatchlistTracker

Operational guide for developers and on-call engineers.

---

## First-Time Setup (Local Development)

### Prerequisites
- Node.js ≥ 20
- PostgreSQL (local or Docker)
- Redis (optional for now — not wired yet)

### Steps

```bash
# 1. Clone and install dependencies
npm install

# 2. Set up environment variables
cp .env.example apps/web/.env.local
# Edit apps/web/.env.local with real values

# 3. Generate VAPID keys for Web Push
npx web-push generate-vapid-keys
# Paste output into .env.local

# 4. Set up the database
npm run db:generate          # Generate Prisma client
npm run db:migrate           # Create tables
npm run db:seed              # Insert demo data (demo@example.com / demo1234)

# 5. Start the Next.js dev server
npm run dev

# 6. (Optional) Start the worker scheduler
npm run workers:dev
```

Open http://localhost:3000 — sign in with demo@example.com / demo1234.

---

## Production Deployment (Vercel + Supabase + Railway)

### Web app (Vercel)
1. Push to `main` branch.
2. Vercel auto-deploys from `apps/web/`.
3. Set all env vars in the Vercel dashboard.
4. Database migrations run manually: `DATABASE_URL=<prod> npx prisma migrate deploy`.

### Worker process (Railway or Render)
1. Create a new service pointing to the same repo.
2. Set start command: `node dist/workers/scheduler.js`
3. Build command: `cd services && npx tsc`
4. Same DATABASE_URL, VAPID keys, email API key.

---

## Environment Variables Reference

See `.env.example` for the full list.

| Variable | Required | Description |
|---|---|---|
| DATABASE_URL | ✅ | PostgreSQL connection string |
| NEXTAUTH_SECRET | ✅ | Random string for JWT signing (openssl rand -base64 32) |
| NEXTAUTH_URL | ✅ | Full URL of the app (e.g. https://watchlisttracker.app) |
| TMDB_API_KEY | ✅ | TMDB v3 API key |
| NEXT_PUBLIC_VAPID_PUBLIC_KEY | ✅ | VAPID public key for Web Push |
| VAPID_PRIVATE_KEY | ✅ | VAPID private key |
| VAPID_SUBJECT | ✅ | `mailto:admin@yourdomain.com` |
| RESEND_API_KEY | ✅ | Resend API key for email |
| EMAIL_FROM | ✅ | Sender address (must be verified domain) |
| REDIS_URL | ⬜ | Redis URL (optional, not used in MVP) |
| SENTRY_DSN | ⬜ | Sentry error tracking |
| TVMAZE_BASE_URL | ⬜ | Defaults to https://api.tvmaze.com |

---

## Database Migrations

```bash
# Create a new migration after editing prisma/schema.prisma
npm run db:migrate

# Apply pending migrations in production
DATABASE_URL=<prod_url> npx prisma migrate deploy

# Open Prisma Studio (DB browser)
npm run db:studio
```

---

## Common Issues

### "PrismaClientInitializationError"
- Check `DATABASE_URL` is correct and the DB is reachable.
- Run `npm run db:generate` to regenerate the Prisma client.

### Push notifications not working
- Verify `NEXT_PUBLIC_VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` are set and match.
- On iOS: the app must be installed to the home screen.
- Check browser console for SW registration errors.

### Email not sending
- Verify `RESEND_API_KEY` and that the `EMAIL_FROM` domain is verified in Resend.

### Workers not running
- Confirm the `services/` process is deployed and connected to the same `DATABASE_URL`.
- Check worker logs for errors in `sync-releases`, `sync-news`, etc.

---

## Monitoring

- **Sentry**: configure `SENTRY_DSN` for real-time error tracking.
- **Vercel Analytics**: enable in the Vercel dashboard (free plan available).
- **Database**: use Supabase dashboard or `pg_stat_activity` for query monitoring.

---

## Adding a New RSS Feed Source

1. Open `services/providers/feeds.ts`.
2. Add an entry to `FEED_SOURCES`:
   ```ts
   { sourceKey: "rss:deadline", url: "https://deadline.com/feed/" }
   ```
3. Deploy the worker process.

---

## Adding a New Theater Provider

1. Implement the `TheatersProvider` interface in `services/providers/theaters.ts`.
2. Add the env var for the API key.
3. Register it in `getProvider()`.
4. Redeploy the worker.
