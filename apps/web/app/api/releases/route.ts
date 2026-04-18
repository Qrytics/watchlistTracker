/**
 * app/api/releases/route.ts
 *
 * GET /api/releases — upcoming episode and movie releases for the user's watchlist
 *
 * Query params:
 *   type = "episodes" | "movies" | "all"  (default "all")
 *   days = number of days ahead to look    (default 30)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireSession, authErrorResponse, AuthError } from "@/lib/auth/getSession";
import { db } from "@/lib/db/client";
import { addDays } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    const { searchParams } = req.nextUrl;
    const type = searchParams.get("type") ?? "all";
    const days = Math.min(Number(searchParams.get("days") ?? 30), 90);

    const until = addDays(new Date(), days);

    // Fetch IDs of series/movies the user is tracking
    const watchlist = await db.watchlistItem.findMany({
      where: { userId: session.user.id },
      select: { itemType: true, seriesId: true, movieId: true },
    });

    const seriesIds = watchlist.filter((w) => w.seriesId).map((w) => w.seriesId!);
    const movieIds = watchlist.filter((w) => w.movieId).map((w) => w.movieId!);

    const [episodes, movies] = await Promise.all([
      type !== "movies"
        ? db.episodeRelease.findMany({
            where: {
              seriesId: { in: seriesIds },
              airDate: { gte: new Date(), lte: until },
            },
            include: { series: { select: { title: true, posterUrl: true } } },
            orderBy: { airDate: "asc" },
          })
        : [],
      type !== "episodes"
        ? db.movieRelease.findMany({
            where: {
              movieId: { in: movieIds },
              releaseDate: { gte: new Date(), lte: until },
            },
            include: { movie: { select: { title: true, posterUrl: true } } },
            orderBy: { releaseDate: "asc" },
          })
        : [],
    ]);

    return NextResponse.json({ data: { episodes, movies }, error: null });
  } catch (err) {
    if (err instanceof AuthError) return authErrorResponse(err);
    console.error("[GET /api/releases]", err);
    return NextResponse.json({ data: null, error: { message: "Internal server error" } }, { status: 500 });
  }
}
