/**
 * app/api/push/unsubscribe/route.ts
 *
 * POST /api/push/unsubscribe — remove a push subscription (user disabled notifications)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireSession, authErrorResponse, AuthError } from "@/lib/auth/getSession";
import { db } from "@/lib/db/client";

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const body = await req.json() as { endpoint: string };

    if (!body.endpoint) {
      return NextResponse.json({ data: null, error: { message: "Missing endpoint" } }, { status: 400 });
    }

    await db.pushSubscription.deleteMany({
      where: { endpoint: body.endpoint, userId: session.user.id },
    });

    return NextResponse.json({ data: { ok: true }, error: null });
  } catch (err) {
    if (err instanceof AuthError) return authErrorResponse(err);
    console.error("[POST /api/push/unsubscribe]", err);
    return NextResponse.json({ data: null, error: { message: "Internal server error" } }, { status: 500 });
  }
}
