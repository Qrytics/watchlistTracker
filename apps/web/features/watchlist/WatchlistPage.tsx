/**
 * features/watchlist/WatchlistPage.tsx
 *
 * Displays the user's tracked series and movies with quick-add search.
 */

"use client";

import useSWR from "swr";
import Link from "next/link";
import { Card, Badge, EmptyState, Button, Spinner } from "@watchlist/ui";
import type { WatchlistItemSummary } from "@watchlist/types";
import { SearchBar } from "@/features/watchlist/SearchBar";
import { WatchlistCard } from "@/features/watchlist/WatchlistCard";

const fetcher = (url: string) => fetch(url).then((r) => r.json()).then((d) => d.data);

export function WatchlistPage() {
  const { data, error, isLoading, mutate } = useSWR<WatchlistItemSummary[]>("/api/watchlist", fetcher);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-600 text-sm">
        Failed to load watchlist.
      </div>
    );
  }

  const series = data?.filter((i) => i.itemType === "SERIES") ?? [];
  const movies = data?.filter((i) => i.itemType === "MOVIE") ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">My Watchlist</h1>
        <Badge
          label={`${(data ?? []).length} items`}
          color="blue"
        />
      </div>

      {/* Search to add new items */}
      <SearchBar onAdd={() => mutate()} />

      {/* Empty state */}
      {data?.length === 0 && (
        <EmptyState
          icon={<span className="text-5xl">📺</span>}
          title="Your watchlist is empty"
          description="Search for a show or movie above to start tracking it."
        />
      )}

      {/* Series section */}
      {series.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Series ({series.length})
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {series.map((item) => (
              <WatchlistCard key={item.id} item={item} onRemove={() => mutate()} />
            ))}
          </div>
        </section>
      )}

      {/* Movies section */}
      {movies.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Movies ({movies.length})
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {movies.map((item) => (
              <WatchlistCard key={item.id} item={item} onRemove={() => mutate()} />
            ))}
          </div>
        </section>
      )}

      {/* Quick links */}
      <div className="flex gap-3 pt-4">
        <Link href="/releases" className="flex-1">
          <Button variant="secondary" className="w-full">View Releases</Button>
        </Link>
        <Link href="/theaters" className="flex-1">
          <Button variant="secondary" className="w-full">Nearby Theatres</Button>
        </Link>
      </div>
    </div>
  );
}
