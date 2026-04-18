/**
 * app/middleware.ts
 *
 * Edge middleware — redirects authenticated users away from auth pages
 * and unauthenticated users away from protected pages.
 *
 * Uses NextAuth's built-in withAuth helper to keep the logic minimal.
 */

import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { token } = req.nextauth;
    const { pathname } = req.nextUrl;

    // Authenticated users visiting auth pages → redirect to /watchlist
    if (token && (pathname === "/login" || pathname === "/signup" || pathname === "/")) {
      return NextResponse.redirect(new URL("/watchlist", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // Allow the middleware function to run for all matched routes.
      // Pages that need protection are listed in `config.matcher` below.
      authorized: () => true,
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimisation)
     * - favicon.ico
     * - public folder files
     * - API routes (handled by their own auth checks)
     */
    "/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|offline.html).*)",
  ],
};
