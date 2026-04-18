/**
 * services/providers/feeds.ts
 *
 * RSS / news feed aggregator provider.
 *
 * Fetches items from configured RSS feeds and normalises them into
 * SourceFeedItem shapes for storage.
 *
 * Feed list is managed in FEED_SOURCES below.
 * To add a new source: push an entry to FEED_SOURCES with the franchise name,
 * a tmdbId for the franchise (used for linking), and the RSS feed URL.
 */

import Parser from "rss-parser";

const rssParser = new Parser();

// ---------------------------------------------------------------------------
// Feed source configuration
// ---------------------------------------------------------------------------

export interface FeedSource {
  /** Short identifier used as the `source` field on stored items. */
  sourceKey: string;
  /** RSS / Atom feed URL. */
  url: string;
  /** If provided, feed items are linked to this franchise. */
  franchiseTmdbId?: string;
}

/** Edit this list to add or remove RSS sources. */
export const FEED_SOURCES: FeedSource[] = [
  {
    sourceKey: "rss:variety-film",
    url: "https://variety.com/v/film/feed/",
  },
  {
    sourceKey: "rss:hollywoodreporter",
    url: "https://www.hollywoodreporter.com/feed/",
  },
  {
    sourceKey: "rss:ign",
    url: "https://feeds.ign.com/ign/all",
  },
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NormalisedFeedItem {
  title: string;
  url: string;
  source: string;
  summary: string | null;
  publishedAt: Date;
  imageUrl: string | null;
  franchiseTmdbId: string | null;
}

// ---------------------------------------------------------------------------
// Fetcher
// ---------------------------------------------------------------------------

/** Fetch and normalise all items from a single RSS feed. */
export async function fetchFeed(source: FeedSource): Promise<NormalisedFeedItem[]> {
  try {
    const feed = await rssParser.parseURL(source.url);
    return (feed.items ?? []).map((item) => ({
      title: item.title ?? "(no title)",
      url: item.link ?? item.guid ?? "",
      source: source.sourceKey,
      summary: item.contentSnippet ?? item.content ?? null,
      publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
      imageUrl: extractImageUrl(item),
      franchiseTmdbId: source.franchiseTmdbId ?? null,
    }));
  } catch (err) {
    console.error(`[feeds] Failed to fetch ${source.url}:`, err);
    return [];
  }
}

/** Fetch and normalise all configured feeds in parallel. */
export async function fetchAllFeeds(): Promise<NormalisedFeedItem[]> {
  const results = await Promise.allSettled(FEED_SOURCES.map(fetchFeed));
  return results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
}

// ---- Helpers ---------------------------------------------------------------

function extractImageUrl(item: Parser.Item & { enclosure?: { url?: string } }): string | null {
  // Try media:content, then enclosure, then nothing
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const media = (item as any)["media:content"] ?? (item as any)["media:thumbnail"];
  if (media?.$.url) return media.$.url;
  if (item.enclosure?.url) return item.enclosure.url;
  return null;
}
