/**
 * app/api/auth/[...nextauth]/route.ts
 *
 * NextAuth catch-all route.
 * All auth HTTP traffic (GET /api/auth/session, POST /api/auth/signin, etc.)
 * is handled here.
 */

import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
