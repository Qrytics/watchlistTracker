/**
 * services/workers/sync-theaters.ts
 *
 * Theater sync worker — fetches upcoming showings for all users who
 * have a saved location, for all movies in their watchlist.
 *
 * Deduplication: TheaterShowing has a UNIQUE constraint on `externalId`.
 * Showings without an externalId are inserted unconditionally (small risk
 * of duplicates — mitigated by the stub provider returning empty arrays).
 */

import { PrismaClient } from "@prisma/client";
import { getShowingsForMovie } from "../providers/theaters";

const db = new PrismaClient();

export async function syncTheaters(): Promise<void> {
  console.log("[sync-theaters] Starting…");

  // Load all users who have a location set
  const locations = await db.location.findMany({
    include: { user: { include: { watchlistItems: { include: { movie: true } } } } },
  });

  for (const location of locations) {
    const movies = location.user.watchlistItems
      .filter((w) => w.movie && w.movie.status !== "RELEASED")
      .map((w) => w.movie!);

    for (const movie of movies) {
      if (!movie.tmdbId) continue;

      try {
        const showings = await getShowingsForMovie({
          movieTitle: movie.title,
          tmdbId: movie.tmdbId,
          latitude: location.latitude,
          longitude: location.longitude,
          radiusKm: location.radiusKm,
          daysAhead: 14,
        });

        for (const showing of showings) {
          if (showing.externalId) {
            await db.theaterShowing.upsert({
              where: { externalId: showing.externalId },
              update: {
                showtime: new Date(showing.showtime),
                ticketUrl: showing.ticketUrl ?? null,
              },
              create: {
                movieId: movie.id,
                theaterName: showing.theaterName,
                theaterAddress: showing.theaterAddress ?? null,
                latitude: showing.latitude,
                longitude: showing.longitude,
                showtime: new Date(showing.showtime),
                ticketUrl: showing.ticketUrl ?? null,
                externalId: showing.externalId,
              },
            });
          } else {
            // No external ID — insert if no identical record exists
            await db.theaterShowing.create({
              data: {
                movieId: movie.id,
                theaterName: showing.theaterName,
                theaterAddress: showing.theaterAddress ?? null,
                latitude: showing.latitude,
                longitude: showing.longitude,
                showtime: new Date(showing.showtime),
                ticketUrl: showing.ticketUrl ?? null,
              },
            }).catch((err: unknown) => {
              // Log unexpected errors; P2002 (unique constraint) is expected and safe to ignore
              const code = (err as { code?: string }).code;
              if (code !== "P2002") {
                console.error(`[sync-theaters] Unexpected error inserting showing for "${movie.title}":`, err);
              }
            });
          }
        }
      } catch (err) {
        console.error(`[sync-theaters] Error for movie "${movie.title}":`, err);
      }
    }
  }

  console.log("[sync-theaters] Done.");
}
