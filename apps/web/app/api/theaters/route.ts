/**
 * app/api/theaters/route.ts
 *
 * GET /api/theaters — theater showings near the user's saved location
 *
 * Query params:
 *   days = number of days ahead to look (default 7)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireSession, authErrorResponse, AuthError } from "@/lib/auth/getSession";
import { db } from "@/lib/db/client";
import { addDays } from "date-fns";
import { haversineDistanceKm } from "@/lib/utils/geo";
import { DEFAULT_THEATER_RADIUS_KM } from "@watchlist/config";

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    const { searchParams } = req.nextUrl;
    const days = Math.min(Number(searchParams.get("days") ?? 7), 30);
    const until = addDays(new Date(), days);

    // Get user location
    const location = await db.location.findUnique({ where: { userId: session.user.id } });
    const radiusKm = location?.radiusKm ?? DEFAULT_THEATER_RADIUS_KM;

    // Get movie IDs from watchlist
    const watchlist = await db.watchlistItem.findMany({
      where: { userId: session.user.id, itemType: "MOVIE" },
      select: { movieId: true },
    });
    const movieIds = watchlist.map((w) => w.movieId!);

    const showings = await db.theaterShowing.findMany({
      where: {
        movieId: { in: movieIds },
        showtime: { gte: new Date(), lte: until },
      },
      include: { movie: { select: { title: true, posterUrl: true } } },
      orderBy: { showtime: "asc" },
    });

    // Filter by distance if user has a location saved
    const filtered = location
      ? showings
          .map((s) => ({
            ...s,
            distanceKm: haversineDistanceKm(location.latitude, location.longitude, s.latitude, s.longitude),
          }))
          .filter((s) => s.distanceKm <= radiusKm)
          .sort((a, b) => a.distanceKm - b.distanceKm)
      : showings;

    return NextResponse.json({ data: filtered, error: null });
  } catch (err) {
    if (err instanceof AuthError) return authErrorResponse(err);
    console.error("[GET /api/theaters]", err);
    return NextResponse.json({ data: null, error: { message: "Internal server error" } }, { status: 500 });
  }
}
