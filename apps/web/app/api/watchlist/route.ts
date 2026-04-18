/**
 * app/api/watchlist/route.ts
 *
 * GET  /api/watchlist  — list the current user's watchlist items
 * POST /api/watchlist  — add a series or movie to the watchlist
 */

import { NextRequest, NextResponse } from "next/server";
import { requireSession, authErrorResponse, AuthError } from "@/lib/auth/getSession";
import { db } from "@/lib/db/client";
import type { WatchlistItemType } from "@watchlist/types";

export async function GET() {
  try {
    const session = await requireSession();

    const items = await db.watchlistItem.findMany({
      where: { userId: session.user.id },
      include: {
        series: true,
        movie: true,
      },
      orderBy: { addedAt: "desc" },
    });

    return NextResponse.json({ data: items, error: null });
  } catch (err) {
    if (err instanceof AuthError) return authErrorResponse(err);
    console.error("[GET /api/watchlist]", err);
    return NextResponse.json({ data: null, error: { message: "Internal server error" } }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const body = await req.json() as { itemType: WatchlistItemType; seriesId?: string; movieId?: string; notes?: string };

    if (!body.itemType || (body.itemType === "SERIES" && !body.seriesId) || (body.itemType === "MOVIE" && !body.movieId)) {
      return NextResponse.json({ data: null, error: { message: "Missing required fields" } }, { status: 400 });
    }

    const item = await db.watchlistItem.create({
      data: {
        userId: session.user.id,
        itemType: body.itemType,
        seriesId: body.seriesId ?? null,
        movieId: body.movieId ?? null,
        notes: body.notes ?? null,
      },
      include: { series: true, movie: true },
    });

    return NextResponse.json({ data: item, error: null }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) return authErrorResponse(err);
    console.error("[POST /api/watchlist]", err);
    return NextResponse.json({ data: null, error: { message: "Internal server error" } }, { status: 500 });
  }
}
