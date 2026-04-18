/**
 * app/api/auth/signup/route.ts
 *
 * POST /api/auth/signup — create a new user account
 *
 * Body: { name: string; email: string; password: string }
 *
 * This is a custom endpoint (not part of NextAuth) because NextAuth's
 * built-in registration requires extra adapters or plugins.
 */

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { name?: string; email?: string; password?: string };

    if (!body.email || !body.password) {
      return NextResponse.json(
        { data: null, error: { message: "Email and password are required" } },
        { status: 400 }
      );
    }

    if (body.password.length < 8) {
      return NextResponse.json(
        { data: null, error: { message: "Password must be at least 8 characters" } },
        { status: 400 }
      );
    }

    const email = body.email.toLowerCase().trim();

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { data: null, error: { message: "An account with this email already exists" } },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(body.password, 12);

    const user = await db.user.create({
      data: {
        email,
        name: body.name?.trim() ?? null,
        passwordHash,
        // Create default preferences
        preference: {
          create: {
            pushEnabled: true,
            emailEnabled: true,
            notifyNewEpisode: true,
            notifyMovieRelease: true,
            notifyTheaterNearby: true,
            advanceNoticeDays: 1,
          },
        },
      },
      select: { id: true, email: true, name: true },
    });

    return NextResponse.json({ data: user, error: null }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/auth/signup]", err);
    return NextResponse.json(
      { data: null, error: { message: "Internal server error" } },
      { status: 500 }
    );
  }
}
