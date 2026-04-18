/**
 * services/workers/sync-releases.ts
 *
 * Sync worker — keeps episode and movie release data up to date.
 *
 * For each tracked Series:
 *   1. Fetch latest episodes from TVMaze.
 *   2. Upsert new/changed EpisodeRelease rows.
 *
 * For each tracked Movie:
 *   1. Fetch regional release dates from TMDB.
 *   2. Upsert new/changed MovieRelease rows.
 *
 * Run on a schedule (see scheduler.ts). Can also be triggered manually.
 */

import { PrismaClient } from "@prisma/client";
import { getEpisodes } from "../providers/tvmaze";
import { getMovieReleaseDates, posterUrl } from "../providers/tmdb";

const db = new PrismaClient();

export async function syncReleases(): Promise<void> {
  console.log("[sync-releases] Starting…");

  await Promise.allSettled([syncEpisodes(), syncMovieReleases()]);

  console.log("[sync-releases] Done.");
}

// ---------------------------------------------------------------------------
// Episodes
// ---------------------------------------------------------------------------

async function syncEpisodes(): Promise<void> {
  const series = await db.series.findMany({
    where: {
      tvmazeId: { not: null },
      status: { not: "ENDED" },
    },
  });

  for (const s of series) {
    try {
      const episodes = await getEpisodes(Number(s.tvmazeId));

      for (const ep of episodes) {
        if (!ep.airstamp) continue;

        await db.episodeRelease.upsert({
          where: { seriesId_season_episode: { seriesId: s.id, season: ep.season, episode: ep.number } },
          update: {
            title: ep.name ?? null,
            airDate: new Date(ep.airstamp),
            summary: ep.summary ? stripHtml(ep.summary) : null,
          },
          create: {
            seriesId: s.id,
            season: ep.season,
            episode: ep.number,
            title: ep.name ?? null,
            airDate: new Date(ep.airstamp),
            summary: ep.summary ? stripHtml(ep.summary) : null,
          },
        });
      }

      console.log(`[sync-releases] ✓ Episodes for "${s.title}" (${episodes.length} eps)`);
    } catch (err) {
      console.error(`[sync-releases] ✗ Episodes for "${s.title}":`, err);
    }
  }
}

// ---------------------------------------------------------------------------
// Movie release dates
// ---------------------------------------------------------------------------

async function syncMovieReleases(): Promise<void> {
  const movies = await db.movie.findMany({
    where: {
      tmdbId: { not: null },
      status: { not: "RELEASED" },
    },
  });

  for (const movie of movies) {
    try {
      const releaseDates = await getMovieReleaseDates(Number(movie.tmdbId));

      for (const regionData of releaseDates) {
        for (const rd of regionData.release_dates) {
          // type 3 = Theatrical; 4 = Digital; 5 = Physical
          const releaseType =
            rd.type === 3 ? "THEATRICAL" :
            rd.type === 4 ? "STREAMING" :
            rd.type === 5 ? "HOME_VIDEO" : null;

          if (!releaseType || !rd.release_date) continue;

          // Use a deterministic pseudo-ID for upsert
          const releaseDate = new Date(rd.release_date);

          // Uses the @@unique([movieId, region, releaseType]) constraint
          await db.movieRelease.upsert({
            where: {
              movieId_region_releaseType: {
                movieId: movie.id,
                region: regionData.iso_3166_1,
                releaseType,
              },
            },
            update: { releaseDate },
            create: {
              movieId: movie.id,
              releaseType,
              releaseDate,
              region: regionData.iso_3166_1,
            },
          });
        }
      }

      // Also update poster if missing
      if (!movie.posterUrl && movie.tmdbId) {
        // We'd need a TMDB details call here — skip for now to avoid rate limits
      }

      console.log(`[sync-releases] ✓ Movie releases for "${movie.title}"`);
    } catch (err) {
      console.error(`[sync-releases] ✗ Movie releases for "${movie.title}":`, err);
    }
  }
}

// ---- Helpers ---------------------------------------------------------------

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").trim();
}
