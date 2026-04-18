/**
 * app/api/push/subscribe/route.ts
 *
 * POST /api/push/subscribe — save a Web Push subscription for the current user's device
 */

import { NextRequest, NextResponse } from "next/server";
import { requireSession, authErrorResponse, AuthError } from "@/lib/auth/getSession";
import { db } from "@/lib/db/client";
import type { PushSubscriptionPayload } from "@watchlist/types";

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const body = await req.json() as PushSubscriptionPayload;

    if (!body.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
      return NextResponse.json({ data: null, error: { message: "Invalid push subscription" } }, { status: 400 });
    }

    const subscription = await db.pushSubscription.upsert({
      where: { endpoint: body.endpoint },
      update: {
        p256dh: body.keys.p256dh,
        auth: body.keys.auth,
        userAgent: body.userAgent ?? null,
      },
      create: {
        userId: session.user.id,
        endpoint: body.endpoint,
        p256dh: body.keys.p256dh,
        auth: body.keys.auth,
        userAgent: body.userAgent ?? null,
      },
    });

    return NextResponse.json({ data: { id: subscription.id }, error: null }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) return authErrorResponse(err);
    console.error("[POST /api/push/subscribe]", err);
    return NextResponse.json({ data: null, error: { message: "Internal server error" } }, { status: 500 });
  }
}
