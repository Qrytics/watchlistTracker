/**
 * services/workers/sync-news.ts
 *
 * News/feed sync worker — fetches RSS feed items and stores new ones.
 *
 * Deduplication is handled by the `url` UNIQUE constraint on SourceFeedItem.
 * Items whose URL already exists are skipped via upsert.
 */

import { PrismaClient } from "@prisma/client";
import { fetchAllFeeds } from "../providers/feeds";

const db = new PrismaClient();

export async function syncNews(): Promise<void> {
  console.log("[sync-news] Starting…");

  const items = await fetchAllFeeds();
  console.log(`[sync-news] Fetched ${items.length} items from all feeds`);

  let newCount = 0;

  for (const item of items) {
    if (!item.url) continue;

    try {
      // Resolve franchiseId from tmdbId if provided
      let franchiseId: string | null = null;
      if (item.franchiseTmdbId) {
        const franchise = await db.franchise.findUnique({ where: { tmdbId: item.franchiseTmdbId } });
        franchiseId = franchise?.id ?? null;
      }

      const result = await db.sourceFeedItem.upsert({
        where: { url: item.url },
        update: {}, // Don't overwrite existing items
        create: {
          title: item.title,
          url: item.url,
          source: item.source,
          summary: item.summary,
          publishedAt: item.publishedAt,
          imageUrl: item.imageUrl,
          franchiseId,
        },
      });

      // Prisma's upsert always returns the record; check if it was newly created
      // by comparing createdAt to now (within a few seconds)
      const isNew = Math.abs(result.createdAt.getTime() - Date.now()) < 5000;
      if (isNew) newCount++;
    } catch (err) {
      console.error(`[sync-news] Error upserting "${item.url}":`, err);
    }
  }

  console.log(`[sync-news] Done. ${newCount} new items stored.`);
}
