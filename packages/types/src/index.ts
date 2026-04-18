/**
 * packages/types/src/index.ts
 *
 * Shared TypeScript types used across apps/web and services/.
 * These are plain data shapes — no Prisma imports here so they can be
 * used safely on both the server and the browser.
 */

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export interface AuthUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

export type SeriesStatus = "ONGOING" | "UPCOMING" | "ENDED" | "CANCELLED";
export type MovieStatus = "UPCOMING" | "RELEASED" | "CANCELLED";
export type ReleaseType = "THEATRICAL" | "STREAMING" | "HOME_VIDEO";

export interface FranchiseSummary {
  id: string;
  name: string;
  description: string | null;
  posterUrl: string | null;
}

export interface SeriesSummary {
  id: string;
  title: string;
  description: string | null;
  posterUrl: string | null;
  status: SeriesStatus;
  tmdbId: string | null;
  tvmazeId: string | null;
  franchiseId: string | null;
}

export interface MovieSummary {
  id: string;
  title: string;
  description: string | null;
  posterUrl: string | null;
  status: MovieStatus;
  tmdbId: string | null;
  franchiseId: string | null;
}

// ---------------------------------------------------------------------------
// Releases
// ---------------------------------------------------------------------------

export interface EpisodeReleaseSummary {
  id: string;
  seriesId: string;
  seriesTitle: string;
  season: number;
  episode: number;
  title: string | null;
  airDate: string; // ISO string
  posterUrl: string | null;
}

export interface MovieReleaseSummary {
  id: string;
  movieId: string;
  movieTitle: string;
  releaseType: ReleaseType;
  releaseDate: string; // ISO string
  region: string;
  posterUrl: string | null;
}

// ---------------------------------------------------------------------------
// Theaters
// ---------------------------------------------------------------------------

export interface TheaterShowingSummary {
  id: string;
  movieId: string;
  movieTitle: string;
  theaterName: string;
  theaterAddress: string | null;
  latitude: number;
  longitude: number;
  showtime: string; // ISO string
  ticketUrl: string | null;
  distanceKm?: number; // computed on the fly
}

// ---------------------------------------------------------------------------
// Watchlist
// ---------------------------------------------------------------------------

export type WatchlistItemType = "SERIES" | "MOVIE";

export interface WatchlistItemSummary {
  id: string;
  itemType: WatchlistItemType;
  addedAt: string; // ISO string
  notes: string | null;
  series?: SeriesSummary;
  movie?: MovieSummary;
}

// ---------------------------------------------------------------------------
// News / Feed
// ---------------------------------------------------------------------------

export interface FeedItemSummary {
  id: string;
  title: string;
  url: string;
  source: string;
  summary: string | null;
  publishedAt: string; // ISO string
  imageUrl: string | null;
  franchiseId: string | null;
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export type NotificationType =
  | "NEW_EPISODE"
  | "MOVIE_RELEASE"
  | "THEATER_NEARBY"
  | "NEWS_UPDATE"
  | "SOCIAL_UPDATE";

export type NotificationChannel = "PUSH" | "EMAIL" | "IN_APP";

export interface NotificationSummary {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  url: string | null;
  channel: NotificationChannel;
  sentAt: string; // ISO string
  read: boolean;
  readAt: string | null;
}

// ---------------------------------------------------------------------------
// User Preferences
// ---------------------------------------------------------------------------

export interface UserPreferenceSummary {
  pushEnabled: boolean;
  emailEnabled: boolean;
  digestEnabled: boolean;
  notifyNewEpisode: boolean;
  notifyMovieRelease: boolean;
  notifyTheaterNearby: boolean;
  notifyNewsUpdates: boolean;
  notifySocialUpdates: boolean;
  advanceNoticeDays: number;
}

export interface LocationSummary {
  latitude: number;
  longitude: number;
  city: string | null;
  country: string | null;
  radiusKm: number;
}

// ---------------------------------------------------------------------------
// API response envelope
// ---------------------------------------------------------------------------

export interface ApiResponse<T> {
  data: T;
  error: null;
}

export interface ApiError {
  data: null;
  error: {
    message: string;
    code?: string;
  };
}

export type ApiResult<T> = ApiResponse<T> | ApiError;

// ---------------------------------------------------------------------------
// Push subscription payload (mirrors web-push PushSubscription)
// ---------------------------------------------------------------------------

export interface PushSubscriptionPayload {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent?: string;
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

export interface SearchResult {
  type: "series" | "movie" | "franchise";
  id: string;
  title: string;
  posterUrl: string | null;
  year: string | null;
}
