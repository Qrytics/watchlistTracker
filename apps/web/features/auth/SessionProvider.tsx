/**
 * features/auth/SessionProvider.tsx
 *
 * Client-side NextAuth session context wrapper.
 * Wraps the whole app so any component can call useSession().
 *
 * Keep this as a thin passthrough — no extra logic here.
 */

"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
