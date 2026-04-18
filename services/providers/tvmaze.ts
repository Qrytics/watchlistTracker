/**
 * services/providers/tvmaze.ts
 *
 * Client for the TVMaze REST API.
 * Docs: https://www.tvmaze.com/api
 *
 * TVMaze is free, no API key required.
 *
 * Provides:
 *   - searchShows()       — full-text show search
 *   - getShowDetails()    — show metadata by TVMaze id
 *   - getEpisodes()       — all episodes for a show (flat list)
 *   - getNextEpisode()    — the upcoming episode for a show
 */

const BASE_URL = process.env.TVMAZE_BASE_URL ?? "https://api.tvmaze.com";

async function tvmazeFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) throw new Error(`TVMaze ${path} → ${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TvmazeShow {
  id: number;
  name: string;
  summary: string | null;
  image: { medium: string; original: string } | null;
  status: string; // "Running" | "Ended" | "In Development" | ...
  externals: { thetvdb?: number; imdb?: string; tmdb?: number };
  _links?: { previousepisode?: { href: string }; nextepisode?: { href: string; name?: string } };
}

export interface TvmazeEpisode {
  id: number;
  name: string;
  season: number;
  number: number;
  airdate: string; // "YYYY-MM-DD"
  airstamp: string; // ISO datetime
  summary: string | null;
  _links?: { self: { href: string } };
}

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------

/** Full-text search — returns array of { score, show } objects. */
export async function searchShows(query: string) {
  return tvmazeFetch<Array<{ score: number; show: TvmazeShow }>>(`/search/shows?q=${encodeURIComponent(query)}`);
}

/** Get show details by TVMaze id. */
export async function getShowDetails(tvmazeId: number): Promise<TvmazeShow> {
  return tvmazeFetch<TvmazeShow>(`/shows/${tvmazeId}`);
}

/** Get all episodes for a show (sorted by airdate). */
export async function getEpisodes(tvmazeId: number): Promise<TvmazeEpisode[]> {
  return tvmazeFetch<TvmazeEpisode[]>(`/shows/${tvmazeId}/episodes`);
}

/** Get the next upcoming episode for a show (may return 404 if none). */
export async function getNextEpisode(tvmazeId: number): Promise<TvmazeEpisode | null> {
  try {
    return await tvmazeFetch<TvmazeEpisode>(`/shows/${tvmazeId}?embed=nextepisode`);
  } catch {
    return null;
  }
}
