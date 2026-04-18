/**
 * app/api/search/route.ts
 *
 * GET /api/search?q=<query> — search for series, movies, and franchises
 *
 * Searches the local DB first; can be extended to proxy TMDB/TVMaze.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireSession, authErrorResponse, AuthError } from "@/lib/auth/getSession";
import { db } from "@/lib/db/client";
import type { SearchResult } from "@watchlist/types";

export async function GET(req: NextRequest) {
  try {
    await requireSession();
    const q = req.nextUrl.searchParams.get("q")?.trim();

    if (!q || q.length < 2) {
      return NextResponse.json({ data: [], error: null });
    }

    const [series, movies, franchises] = await Promise.all([
      db.series.findMany({
        where: { title: { contains: q, mode: "insensitive" } },
        take: 5,
        select: { id: true, title: true, posterUrl: true },
      }),
      db.movie.findMany({
        where: { title: { contains: q, mode: "insensitive" } },
        take: 5,
        select: { id: true, title: true, posterUrl: true },
      }),
      db.franchise.findMany({
        where: { name: { contains: q, mode: "insensitive" } },
        take: 3,
        select: { id: true, name: true, posterUrl: true },
      }),
    ]);

    const results: SearchResult[] = [
      ...series.map((s) => ({ type: "series" as const, id: s.id, title: s.title, posterUrl: s.posterUrl, year: null })),
      ...movies.map((m) => ({ type: "movie" as const, id: m.id, title: m.title, posterUrl: m.posterUrl, year: null })),
      ...franchises.map((f) => ({ type: "franchise" as const, id: f.id, title: f.name, posterUrl: f.posterUrl, year: null })),
    ];

    return NextResponse.json({ data: results, error: null });
  } catch (err) {
    if (err instanceof AuthError) return authErrorResponse(err);
    console.error("[GET /api/search]", err);
    return NextResponse.json({ data: null, error: { message: "Internal server error" } }, { status: 500 });
  }
}
