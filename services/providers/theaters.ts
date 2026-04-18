/**
 * services/providers/theaters.ts
 *
 * Theater showings provider abstraction.
 *
 * Reality: there is no single free global theater API.
 * This file provides a thin abstraction layer so that different
 * regional providers or partner APIs can be plugged in later
 * without changing worker code.
 *
 * Current strategy (Phase 1):
 *   - SerpAPI (Google Showtimes) for US-based lookups.
 *   - Returns empty array in regions not yet covered.
 *   - Extend by adding new provider implementations below.
 *
 * To add a provider: implement the TheatersProvider interface and
 * register it in getProvider().
 */

import type { TheaterShowingSummary } from "@watchlist/types";

// ---------------------------------------------------------------------------
// Provider interface
// ---------------------------------------------------------------------------

export interface TheatersProvider {
  /** Search for showings of a specific movie near a lat/lng within radiusKm. */
  getShowings(opts: {
    movieTitle: string;
    tmdbId: string;
    latitude: number;
    longitude: number;
    radiusKm: number;
    daysAhead?: number;
  }): Promise<Omit<TheaterShowingSummary, "movieId" | "movieTitle">[]>;
}

// ---------------------------------------------------------------------------
// Stub provider (returns empty — safe fallback when no API key is configured)
// ---------------------------------------------------------------------------

const stubProvider: TheatersProvider = {
  async getShowings() {
    // No theater data available. Replace this with a real provider.
    return [];
  },
};

// ---------------------------------------------------------------------------
// Provider registry — add real providers here as they become available
// ---------------------------------------------------------------------------

function getProvider(): TheatersProvider {
  // Future: if (process.env.SERPAPI_KEY) return serpApiProvider;
  // Future: if (process.env.MOVIEFONE_KEY) return movieFoneProvider;
  return stubProvider;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Get nearby showings for a single movie using the active provider. */
export async function getShowingsForMovie(opts: {
  movieTitle: string;
  tmdbId: string;
  latitude: number;
  longitude: number;
  radiusKm: number;
  daysAhead?: number;
}): Promise<Omit<TheaterShowingSummary, "movieId" | "movieTitle">[]> {
  const provider = getProvider();
  try {
    return await provider.getShowings(opts);
  } catch (err) {
    console.error("[theaters] Provider error:", err);
    return [];
  }
}
