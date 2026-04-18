/**
 * services/workers/scheduler.ts
 *
 * Cron-based scheduler that wires together all background workers.
 *
 * Run this process alongside the Next.js app:
 *   npm run workers:dev    (development)
 *   node dist/workers/scheduler.js  (production)
 *
 * Schedule overview:
 *   - sync-releases   every 4 hours   (keep episode/movie data fresh)
 *   - sync-news       every 30 min    (fetch RSS items frequently)
 *   - sync-theaters   every 6 hours   (theater data changes slowly)
 *   - send-notifications every hour   (dispatch alerts window)
 *
 * All jobs are wrapped in try/catch so a single failure doesn't crash the process.
 */

import cron from "node-cron";
import { syncReleases } from "./sync-releases";
import { syncNews } from "./sync-news";
import { syncTheaters } from "./sync-theaters";
import { sendNotifications } from "./send-notifications";

function safe(name: string, fn: () => Promise<void>): () => void {
  return () => {
    fn().catch((err) => console.error(`[scheduler] ${name} error:`, err));
  };
}

export function startScheduler(): void {
  console.log("[scheduler] Starting background workers…");

  // Sync episode and movie release data every 4 hours
  cron.schedule("0 */4 * * *", safe("sync-releases", syncReleases));

  // Sync RSS news feeds every 30 minutes
  cron.schedule("*/30 * * * *", safe("sync-news", syncNews));

  // Sync theater showings every 6 hours
  cron.schedule("0 */6 * * *", safe("sync-theaters", syncTheaters));

  // Dispatch notifications every hour
  cron.schedule("0 * * * *", safe("send-notifications", sendNotifications));

  console.log("[scheduler] All workers scheduled. Press Ctrl+C to stop.");

  // Run each job once on startup so data is available immediately
  safe("sync-releases", syncReleases)();
  safe("sync-news", syncNews)();
  safe("send-notifications", sendNotifications)();
}
