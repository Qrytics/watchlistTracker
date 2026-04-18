/**
 * lib/auth/getSession.ts
 *
 * Helper that retrieves the current server-side session and throws
 * a 401 if no session exists. Use inside API route handlers.
 *
 * Usage:
 *   const session = await requireSession();
 *   // session.user.id is guaranteed to be set
 */

import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "./authOptions";

export async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new AuthError("Unauthorized", 401);
  }
  return session as typeof session & { user: { id: string; email: string; name: string | null } };
}

/** Thrown when a request is not authenticated or authorized. */
export class AuthError extends Error {
  constructor(message: string, public readonly status: number = 401) {
    super(message);
    this.name = "AuthError";
  }
}

/** Converts an AuthError to a NextResponse. */
export function authErrorResponse(err: AuthError): NextResponse {
  return NextResponse.json({ data: null, error: { message: err.message } }, { status: err.status });
}
