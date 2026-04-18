/**
 * app/api/news/route.ts
 *
 * GET /api/news — recent news/social feed items related to the user's franchises
 *
 * Query params:
 *   franchiseId = filter by franchise (optional)
 *   limit       = max items (default 20)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireSession, authErrorResponse, AuthError } from "@/lib/auth/getSession";
import { db } from "@/lib/db/client";
import { DEFAULT_PAGE_SIZE } from "@watchlist/config";

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    const { searchParams } = req.nextUrl;
    const franchiseId = searchParams.get("franchiseId") ?? undefined;
    const limit = Math.min(Number(searchParams.get("limit") ?? DEFAULT_PAGE_SIZE), 100);

    // Get franchise IDs from the user's watchlist (via series/movies)
    const watchlist = await db.watchlistItem.findMany({
      where: { userId: session.user.id },
      include: {
        series: { select: { franchiseId: true } },
        movie: { select: { franchiseId: true } },
      },
    });

    const franchiseIds = [
      ...new Set(
        watchlist
          .flatMap((w) => [w.series?.franchiseId, w.movie?.franchiseId])
          .filter(Boolean) as string[]
      ),
    ];

    const items = await db.sourceFeedItem.findMany({
      where: {
        franchiseId: franchiseId
          ? { equals: franchiseId }
          : { in: franchiseIds.length ? franchiseIds : undefined },
      },
      orderBy: { publishedAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ data: items, error: null });
  } catch (err) {
    if (err instanceof AuthError) return authErrorResponse(err);
    console.error("[GET /api/news]", err);
    return NextResponse.json({ data: null, error: { message: "Internal server error" } }, { status: 500 });
  }
}
