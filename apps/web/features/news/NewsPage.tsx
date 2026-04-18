/**
 * features/news/NewsPage.tsx
 *
 * Displays franchise news and social feed items aggregated by the worker.
 */

"use client";

import useSWR from "swr";
import { formatDistanceToNow } from "date-fns";
import { Card, Spinner, EmptyState } from "@watchlist/ui";
import Image from "next/image";

const fetcher = (url: string) => fetch(url).then((r) => r.json()).then((d) => d.data);

export function NewsPage() {
  const { data, isLoading } = useSWR("/api/news?limit=30", fetcher);

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-gray-900">News & Updates</h1>

      {isLoading && (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      )}

      {!isLoading && data?.length === 0 && (
        <EmptyState
          icon={<span className="text-5xl">📰</span>}
          title="No news yet"
          description="News and updates for your tracked franchises will appear here."
        />
      )}

      <div className="space-y-3">
        {(data ?? []).map((item: {
          id: string;
          title: string;
          url: string;
          source: string;
          summary?: string;
          publishedAt: string;
          imageUrl?: string;
        }) => (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <Card className="flex gap-3 hover:shadow-md transition-shadow">
              {item.imageUrl && (
                <div className="relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg">
                  <Image src={item.imageUrl} alt="" fill className="object-cover" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 line-clamp-2">{item.title}</p>
                {item.summary && (
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{item.summary}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {item.source} · {formatDistanceToNow(new Date(item.publishedAt), { addSuffix: true })}
                </p>
              </div>
            </Card>
          </a>
        ))}
      </div>
    </div>
  );
}
