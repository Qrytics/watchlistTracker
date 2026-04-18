/**
 * app/api/settings/route.ts
 *
 * GET   /api/settings — get the user's preferences and location
 * PATCH /api/settings — update preferences and/or location
 */

import { NextRequest, NextResponse } from "next/server";
import { requireSession, authErrorResponse, AuthError } from "@/lib/auth/getSession";
import { db } from "@/lib/db/client";
import type { UserPreferenceSummary, LocationSummary } from "@watchlist/types";

export async function GET() {
  try {
    const session = await requireSession();

    const [preference, location] = await Promise.all([
      db.userPreference.findUnique({ where: { userId: session.user.id } }),
      db.location.findUnique({ where: { userId: session.user.id } }),
    ]);

    return NextResponse.json({ data: { preference, location }, error: null });
  } catch (err) {
    if (err instanceof AuthError) return authErrorResponse(err);
    console.error("[GET /api/settings]", err);
    return NextResponse.json({ data: null, error: { message: "Internal server error" } }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireSession();
    const body = await req.json() as {
      preference?: Partial<UserPreferenceSummary>;
      location?: Partial<LocationSummary>;
    };

    const [preference, location] = await Promise.all([
      body.preference
        ? db.userPreference.upsert({
            where: { userId: session.user.id },
            update: body.preference,
            create: { userId: session.user.id, ...body.preference },
          })
        : Promise.resolve(null),
      body.location?.latitude && body.location?.longitude
        ? db.location.upsert({
            where: { userId: session.user.id },
            update: body.location,
            create: {
              userId: session.user.id,
              latitude: body.location.latitude,
              longitude: body.location.longitude,
              city: body.location.city ?? null,
              country: body.location.country ?? null,
              radiusKm: body.location.radiusKm ?? 50,
            },
          })
        : Promise.resolve(null),
    ]);

    return NextResponse.json({ data: { preference, location }, error: null });
  } catch (err) {
    if (err instanceof AuthError) return authErrorResponse(err);
    console.error("[PATCH /api/settings]", err);
    return NextResponse.json({ data: null, error: { message: "Internal server error" } }, { status: 500 });
  }
}
