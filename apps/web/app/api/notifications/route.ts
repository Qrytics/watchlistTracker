/**
 * app/api/notifications/route.ts
 *
 * GET   /api/notifications — list the user's notification history
 * PATCH /api/notifications — mark notifications as read
 */

import { NextRequest, NextResponse } from "next/server";
import { requireSession, authErrorResponse, AuthError } from "@/lib/auth/getSession";
import { db } from "@/lib/db/client";
import { DEFAULT_PAGE_SIZE } from "@watchlist/config";

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    const { searchParams } = req.nextUrl;
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const limit = Math.min(Number(searchParams.get("limit") ?? DEFAULT_PAGE_SIZE), 100);

    const notifications = await db.notification.findMany({
      where: {
        userId: session.user.id,
        ...(unreadOnly ? { read: false } : {}),
      },
      orderBy: { sentAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ data: notifications, error: null });
  } catch (err) {
    if (err instanceof AuthError) return authErrorResponse(err);
    console.error("[GET /api/notifications]", err);
    return NextResponse.json({ data: null, error: { message: "Internal server error" } }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireSession();
    const body = await req.json() as { ids?: string[]; all?: boolean };

    if (body.all) {
      await db.notification.updateMany({
        where: { userId: session.user.id, read: false },
        data: { read: true, readAt: new Date() },
      });
    } else if (body.ids?.length) {
      await db.notification.updateMany({
        where: { userId: session.user.id, id: { in: body.ids } },
        data: { read: true, readAt: new Date() },
      });
    }

    return NextResponse.json({ data: { ok: true }, error: null });
  } catch (err) {
    if (err instanceof AuthError) return authErrorResponse(err);
    console.error("[PATCH /api/notifications]", err);
    return NextResponse.json({ data: null, error: { message: "Internal server error" } }, { status: 500 });
  }
}
