# Data Flow — WatchlistTracker

This document traces how data enters, moves through, and exits the system.

---

## 1. Content Metadata (series, movies, franchises)

```
Developer / Admin seeds via prisma/seed.ts
    OR
User searches → GET /api/search?q=<query>
    → db.series + db.movie full-text search (local DB)
    → Returns matches → user clicks "Add" → POST /api/watchlist

Later:
sync-releases worker pulls TMDB / TVMaze and upserts Series, Movie, EpisodeRelease, MovieRelease rows
```

> **Source of truth**: PostgreSQL via Prisma.
> External APIs (TMDB/TVMaze) are synced periodically into the DB — API routes never call external APIs in real time during user requests.

---

## 2. User Watchlist

```
User adds item:
  POST /api/watchlist { itemType, seriesId | movieId }
    → db.watchlistItem.create

User removes item:
  DELETE /api/watchlist/:id
    → db.watchlistItem.delete (auth check: userId must match)

User views watchlist:
  GET /api/watchlist
    → db.watchlistItem.findMany (with series/movie join)
```

---

## 3. Release Data

```
Background worker (every 4 hours):
  sync-releases.ts
    → TVMaze getEpisodes(tvmazeId) → upsert EpisodeRelease
    → TMDB getMovieReleaseDates(tmdbId) → upsert MovieRelease

User views releases:
  GET /api/releases?type=all&days=30
    → db.episodeRelease.findMany (filtered to user's seriesIds)
    → db.movieRelease.findMany  (filtered to user's movieIds)
```

---

## 4. Theater Showings

```
Background worker (every 6 hours):
  sync-theaters.ts
    → For each user with a saved Location:
        → For each movie in their watchlist:
            → theaters provider getShowingsForMovie(...)
            → upsert TheaterShowing rows

User views theatres:
  GET /api/theaters?days=14
    → db.theaterShowing.findMany (filtered to user's movieIds + date window)
    → Haversine distance filter (in memory, against user's saved location)
    → Returns sorted by distance
```

---

## 5. News / RSS Feed

```
Background worker (every 30 min):
  sync-news.ts
    → fetchAllFeeds() — parallel RSS fetch via rss-parser
    → For each item: db.sourceFeedItem.upsert (dedup by URL)

User views news:
  GET /api/news?limit=30
    → Resolves franchise IDs from user's watchlist
    → db.sourceFeedItem.findMany (filtered to those franchises)
    → Returns sorted by publishedAt desc
```

---

## 6. Notifications

```
Background worker (every hour):
  send-notifications.ts
    → Finds unsynced EpisodeRelease rows in the advance-notice window
    → Finds unsynced MovieRelease rows in the advance-notice window
    → For each: load tracking users + their preferences + push subscriptions
    → sendPush() → web-push → browser push service → service worker
    → sendEmail() → Resend → user inbox
    → db.notification.create (in-app audit log)
    → Mark row as synced

User views notification history:
  GET /api/notifications
    → db.notification.findMany for the user

User marks read:
  PATCH /api/notifications { all: true } or { ids: [...] }
    → db.notification.updateMany

Push subscription management:
  POST /api/push/subscribe   → db.pushSubscription.upsert
  POST /api/push/unsubscribe → db.pushSubscription.deleteMany
```

---

## 7. User Preferences & Location

```
GET  /api/settings → UserPreference + Location for current user
PATCH /api/settings { preference: {...}, location: {...} }
  → db.userPreference.upsert
  → db.location.upsert
```

---

## Data Freshness Summary

| Data | Source | Sync frequency |
|---|---|---|
| Episode releases | TVMaze | Every 4 hours |
| Movie releases | TMDB | Every 4 hours |
| Theater showings | Theater provider | Every 6 hours |
| RSS news items | Configured feeds | Every 30 minutes |
| User watchlist | User action (real-time) | On demand |
| Notifications sent | Worker dispatch | Every hour |
