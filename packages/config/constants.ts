/**
 * packages/config/constants.ts
 *
 * App-wide constants shared across apps/web and services/.
 * Keep values here instead of in .env so they are version-controlled
 * and visible to all agents reading the codebase.
 */

// ---------------------------------------------------------------------------
// TMDB
// ---------------------------------------------------------------------------

/** Base URL for TMDB v3 REST API */
export const TMDB_BASE_URL = "https://api.themoviedb.org/3";

/** Base URL for TMDB image CDN */
export const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p";

/** Poster image size for list views */
export const TMDB_POSTER_SIZE_SM = "w342";

/** Poster image size for detail views */
export const TMDB_POSTER_SIZE_LG = "w780";

// ---------------------------------------------------------------------------
// TVMaze
// ---------------------------------------------------------------------------

/** Base URL for TVMaze REST API */
export const TVMAZE_BASE_URL = "https://api.tvmaze.com";

// ---------------------------------------------------------------------------
// Worker / scheduler intervals (milliseconds)
// ---------------------------------------------------------------------------

/** How often the release-sync worker runs */
export const RELEASE_SYNC_INTERVAL_MS = 4 * 60 * 60 * 1000; // 4 hours

/** How often the theater-sync worker runs */
export const THEATER_SYNC_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours

/** How often the news-feed worker runs */
export const NEWS_SYNC_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

/** How often the notification dispatcher runs */
export const NOTIFY_DISPATCH_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

// ---------------------------------------------------------------------------
// Notification
// ---------------------------------------------------------------------------

/** Maximum notifications per user per day to avoid fatigue */
export const MAX_NOTIFICATIONS_PER_USER_PER_DAY = 10;

// ---------------------------------------------------------------------------
// Theater search
// ---------------------------------------------------------------------------

/** Default theater search radius in kilometres if the user hasn't set a location */
export const DEFAULT_THEATER_RADIUS_KM = 50;

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// ---------------------------------------------------------------------------
// Cache TTL (seconds)
// ---------------------------------------------------------------------------

export const CACHE_TTL_SHORT = 60;        // 1 minute — live data like showings
export const CACHE_TTL_MEDIUM = 60 * 15; // 15 minutes — releases
export const CACHE_TTL_LONG = 60 * 60;  // 1 hour — metadata (posters, descriptions)
