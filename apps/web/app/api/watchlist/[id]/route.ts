/**
 * app/api/watchlist/[id]/route.ts
 *
 * DELETE /api/watchlist/:id — remove an item from the watchlist
 * PATCH  /api/watchlist/:id — update notes on a watchlist item
 */

import { NextRequest, NextResponse } from "next/server";
import { requireSession, authErrorResponse, AuthError } from "@/lib/auth/getSession";
import { db } from "@/lib/db/client";

type Params = { params: { id: string } };

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireSession();

    const item = await db.watchlistItem.findUnique({ where: { id: params.id } });
    if (!item) return NextResponse.json({ data: null, error: { message: "Not found" } }, { status: 404 });
    if (item.userId !== session.user.id) return NextResponse.json({ data: null, error: { message: "Forbidden" } }, { status: 403 });

    await db.watchlistItem.delete({ where: { id: params.id } });
    return NextResponse.json({ data: { id: params.id }, error: null });
  } catch (err) {
    if (err instanceof AuthError) return authErrorResponse(err);
    console.error("[DELETE /api/watchlist/:id]", err);
    return NextResponse.json({ data: null, error: { message: "Internal server error" } }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await requireSession();
    const body = await req.json() as { notes?: string };

    const item = await db.watchlistItem.findUnique({ where: { id: params.id } });
    if (!item) return NextResponse.json({ data: null, error: { message: "Not found" } }, { status: 404 });
    if (item.userId !== session.user.id) return NextResponse.json({ data: null, error: { message: "Forbidden" } }, { status: 403 });

    const updated = await db.watchlistItem.update({
      where: { id: params.id },
      data: { notes: body.notes ?? null },
    });

    return NextResponse.json({ data: updated, error: null });
  } catch (err) {
    if (err instanceof AuthError) return authErrorResponse(err);
    console.error("[PATCH /api/watchlist/:id]", err);
    return NextResponse.json({ data: null, error: { message: "Internal server error" } }, { status: 500 });
  }
}
