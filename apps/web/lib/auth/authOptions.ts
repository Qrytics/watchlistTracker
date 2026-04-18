/**
 * lib/auth/authOptions.ts
 *
 * NextAuth configuration used by:
 *  - app/api/auth/[...nextauth]/route.ts  (HTTP handler)
 *  - app/(dashboard)/layout.tsx            (getServerSession)
 *  - Any server component needing the session
 *
 * Strategy: Credentials (email + bcrypt password) for MVP.
 *           Add OAuth providers here later (Google, Discord, etc.)
 */

import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db/client";

export const authOptions: NextAuthOptions = {
  // Prisma adapter persists sessions/accounts to the database.
  // PrismaAdapter's type from @auth/prisma-adapter is not perfectly compatible with
  // NextAuth v4's Adapter type. The cast is safe here — the runtime behaviour is correct.
  adapter: PrismaAdapter(db) as NextAuthOptions["adapter"],

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  pages: {
    signIn: "/login",
    newUser: "/watchlist",
  },

  providers: [
    CredentialsProvider({
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "you@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;

        const user = await db.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });

        if (!user?.passwordHash) return null;

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, name: user.name, email: user.email, image: user.image };
      },
    }),
  ],

  callbacks: {
    // Attach the user id from the database to the JWT token.
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    // Expose the user id on the session object so components can use it.
    async session({ session, token }) {
      if (session.user && token.id) {
        (session.user as { id?: string }).id = token.id as string;
      }
      return session;
    },
  },
};
