/**
 * lib/db/client.ts
 *
 * Singleton Prisma client.
 *
 * In development Next.js uses hot-reload which creates new module instances
 * on each reload. This pattern prevents exhausting the DB connection pool.
 */

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
