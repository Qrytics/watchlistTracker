/**
 * features/watchlist/WatchlistCard.tsx
 *
 * Single watchlist item card — shows poster, title, status badge,
 * and a remove button.
 */

"use client";

import { useState } from "react";
import Image from "next/image";
import { Badge, Card } from "@watchlist/ui";
import type { WatchlistItemSummary } from "@watchlist/types";

interface WatchlistCardProps {
  item: WatchlistItemSummary;
  onRemove: () => void;
}

const STATUS_COLOR = {
  ONGOING: "green",
  UPCOMING: "blue",
  ENDED: "gray",
  CANCELLED: "red",
  RELEASED: "green",
} as const;

export function WatchlistCard({ item, onRemove }: WatchlistCardProps) {
  const [removing, setRemoving] = useState(false);
  const content = item.series ?? item.movie;

  async function handleRemove() {
    setRemoving(true);
    await fetch(`/api/watchlist/${item.id}`, { method: "DELETE" });
    onRemove();
  }

  if (!content) return null;

  return (
    <Card className="relative flex flex-col gap-2">
      {/* Poster */}
      <div className="aspect-[2/3] w-full overflow-hidden rounded-lg bg-gray-200">
        {content.posterUrl ? (
          <Image
            src={content.posterUrl}
            alt={content.title || "Poster"}
            fill
            sizes="(max-width: 640px) 50vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-3xl text-gray-400">🎬</div>
        )}
      </div>

      {/* Title */}
      <p className="text-xs font-semibold text-gray-900 leading-tight line-clamp-2">{content.title}</p>

      {/* Status */}
      {'status' in content && (
        <Badge
          label={content.status}
          color={STATUS_COLOR[content.status as keyof typeof STATUS_COLOR] ?? "gray"}
        />
      )}

      {/* Remove button */}
      <button
        onClick={handleRemove}
        disabled={removing}
        aria-label={`Remove ${content.title}`}
        className="absolute top-2 right-2 rounded-full bg-black/40 p-1 text-white text-xs hover:bg-black/60 disabled:opacity-50"
      >
        ✕
      </button>
    </Card>
  );
}
