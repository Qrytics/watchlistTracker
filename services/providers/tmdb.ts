/**
 * services/providers/tmdb.ts
 *
 * Client for The Movie Database (TMDB) v3 API.
 * Docs: https://developers.themoviedb.org/3
 *
 * Provides:
 *   - searchMulti()       — search for movies, series, and people
 *   - getMovieDetails()   — full movie metadata including release dates
 *   - getSeriesDetails()  — full TV series metadata
 *   - getSeriesEpisodes() — episodes for a given season
 *   - getMovieReleaseDates() — regional release date information
 *
 * All responses are raw TMDB shapes. Callers are responsible for mapping
 * them to the app's domain types.
 */

const BASE_URL = process.env.TMDB_BASE_URL ?? "https://api.themoviedb.org/3";
const API_KEY = process.env.TMDB_API_KEY ?? "";

async function tmdbFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  url.searchParams.set("api_key", API_KEY);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`TMDB ${path} → ${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Types (minimal — only fields we actually use)
// ---------------------------------------------------------------------------

export interface TmdbMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  release_date: string;
  status: string;
}

export interface TmdbSeries {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  status: string;
  number_of_seasons: number;
}

export interface TmdbEpisode {
  id: number;
  episode_number: number;
  season_number: number;
  name: string;
  overview: string;
  air_date: string;
}

export interface TmdbReleaseDateResult {
  iso_3166_1: string;
  release_dates: Array<{ release_date: string; type: number }>;
}

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------

/** Search across movies, TV series, and people. Returns raw TMDB results array. */
export async function searchMulti(query: string) {
  const data = await tmdbFetch<{ results: Array<{ media_type: string; id: number; title?: string; name?: string; poster_path?: string }> }>(
    "/search/multi",
    { query, page: "1" }
  );
  return data.results;
}

/** Full movie metadata. */
export async function getMovieDetails(tmdbId: number): Promise<TmdbMovie> {
  return tmdbFetch<TmdbMovie>(`/movie/${tmdbId}`);
}

/** Full TV series metadata. */
export async function getSeriesDetails(tmdbId: number): Promise<TmdbSeries> {
  return tmdbFetch<TmdbSeries>(`/tv/${tmdbId}`);
}

/** All episodes for a given season. */
export async function getSeriesEpisodes(tmdbId: number, season: number): Promise<TmdbEpisode[]> {
  const data = await tmdbFetch<{ episodes: TmdbEpisode[] }>(`/tv/${tmdbId}/season/${season}`);
  return data.episodes ?? [];
}

/** Regional release dates for a movie. */
export async function getMovieReleaseDates(tmdbId: number): Promise<TmdbReleaseDateResult[]> {
  const data = await tmdbFetch<{ results: TmdbReleaseDateResult[] }>(`/movie/${tmdbId}/release_dates`);
  return data.results ?? [];
}

/** Build a full TMDB image URL from a poster_path. */
export function posterUrl(path: string | null, size = "w342"): string | null {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/${size}${path}`;
}
