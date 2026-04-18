# Provider Decisions

This document records why each external data provider was chosen and what the fallback plan is if it becomes unavailable.

---

## TV Episodes — TVMaze

**Why TVMaze?**
- Free REST API, no API key required.
- Rich episode-level metadata: air dates, airstamp (timezone-aware), summaries, images.
- Reliable uptime and permissive rate limits for non-commercial use.
- Includes `externals.tmdb` and `externals.thetvdb` for cross-referencing.

**Limitations**
- No official commercial SLA.
- Primarily English-language content.

**Fallback**
- TMDB also provides TV series and season/episode data via `/tv/{id}/season/{n}`.
  Switch by implementing a `tmdb` episode provider branch in `sync-releases.ts`.

---

## Movie & Series Metadata — TMDB

**Why TMDB?**
- Industry-standard metadata: titles, posters, descriptions, release dates, collections.
- Free tier covers all our use cases.
- High-quality image CDN (`image.tmdb.org`).
- Regional release date breakdowns via `/movie/{id}/release_dates`.

**Limitations**
- API key required (free at developers.themoviedb.org).
- Rate-limited (40 requests/10s on free tier). Workers use sequential calls with per-series delay.

**Fallback**
- OMDb API (`https://www.omdbapi.com`) for basic metadata if TMDB is down.

---

## Theater Showings — Provider Abstraction (Stub)

**Status**: Phase 1 uses a stub that returns empty arrays. The abstraction layer (`services/providers/theaters.ts`) is in place so real providers can be plugged in.

**Candidate providers**
| Provider | Coverage | Cost |
|---|---|---|
| SerpAPI (Google Showtimes) | Global | Paid |
| Fandango API | US | Commercial |
| Ticketmaster Discovery API | US/Europe | Free tier |
| Kinoheld API | Germany/Austria | Commercial |

**Integration path**
1. Implement `TheatersProvider` interface in `services/providers/theaters.ts`.
2. Add env vars for the provider's API key.
3. Register the provider in `getProvider()`.
4. No worker code changes needed.

---

## News / RSS Feeds — rss-parser

**Why RSS?**
- RSS is universally supported, free, and doesn't require API approval.
- Reliable sources: Variety, The Hollywood Reporter, IGN.
- No rate limits compared to social APIs.

**Limitations**
- No real-time (polling every 30 min).
- Quality varies by source.
- Reddit/Twitter/Bluesky require OAuth — deferred to Phase 3.

**Phase 3 plan**
- Reddit JSON API (no auth needed for public subreddits, but rate-limited).
- Twitter v2 API (requires developer account).
- Bluesky AT Protocol.

---

## Email — Resend

**Why Resend?**
- Simple API, generous free tier (100 emails/day).
- Great deliverability, DKIM/SPF setup is straightforward.
- TypeScript SDK with clean types.

**Fallback**
- SendGrid or Postmark — swap the `sendEmail` implementation in `lib/email/sendEmail.ts`.

---

## Push Notifications — web-push (VAPID)

**Why VAPID + web-push?**
- No third-party service dependency (Firebase, OneSignal, etc.).
- Works with all major browsers on Android.
- iOS 16.4+ supports Web Push for installed PWAs.
- Full control over notification delivery.

**Limitations**
- iOS requires the PWA to be added to the home screen first.
- Safari on iOS < 16.4 doesn't support Web Push.

**Fallback**
- For unsupported browsers: in-app notification badge + email.
