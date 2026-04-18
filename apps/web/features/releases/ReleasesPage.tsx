/**
 * features/releases/ReleasesPage.tsx
 *
 * Shows upcoming episode releases and movie releases for the user's watchlist.
 * Tabs switch between episodes, movies, and all.
 */

"use client";

import { useState } from "react";
import useSWR from "swr";
import { format } from "date-fns";
import { Card, Badge, Spinner, EmptyState } from "@watchlist/ui";
import Image from "next/image";

type Tab = "all" | "episodes" | "movies";

const fetcher = (url: string) => fetch(url).then((r) => r.json()).then((d) => d.data);

export function ReleasesPage() {
  const [tab, setTab] = useState<Tab>("all");
  const { data, isLoading } = useSWR(`/api/releases?type=${tab}&days=60`, fetcher);

  const episodes: unknown[] = data?.episodes ?? [];
  const movies: unknown[] = data?.movies ?? [];

  const TABS: { key: Tab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "episodes", label: "Episodes" },
    { key: "movies", label: "Movies" },
  ];

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-gray-900">Upcoming Releases</h1>

      {/* Tab bar */}
      <div className="flex gap-2 border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={[
              "pb-2 px-3 text-sm font-medium border-b-2 -mb-px transition-colors",
              tab === t.key
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700",
            ].join(" ")}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      )}

      {!isLoading && episodes.length === 0 && movies.length === 0 && (
        <EmptyState
          icon={<span className="text-5xl">📅</span>}
          title="No upcoming releases"
          description="Add more shows and movies to your watchlist to see releases here."
        />
      )}

      {/* Episode list */}
      {tab !== "movies" && episodes.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Episodes</h2>
          <div className="space-y-3">
            {(episodes as Array<{
              id: string;
              season: number;
              episode: number;
              title?: string;
              airDate: string;
              series: { title: string; posterUrl?: string };
            }>).map((ep) => (
              <Card key={ep.id} className="flex items-center gap-3">
                {ep.series.posterUrl && (
                  <div className="relative h-16 w-12 flex-shrink-0 overflow-hidden rounded-lg">
                    <Image src={ep.series.posterUrl} alt={ep.series.title} fill className="object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{ep.series.title}</p>
                  <p className="text-xs text-gray-500">
                    S{String(ep.season).padStart(2, "0")}E{String(ep.episode).padStart(2, "0")}
                    {ep.title ? ` — ${ep.title}` : ""}
                  </p>
                </div>
                <Badge label={format(new Date(ep.airDate), "MMM d")} color="green" />
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Movie release list */}
      {tab !== "episodes" && movies.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Movies</h2>
          <div className="space-y-3">
            {(movies as Array<{
              id: string;
              releaseType: string;
              releaseDate: string;
              region: string;
              movie: { title: string; posterUrl?: string };
            }>).map((rel) => (
              <Card key={rel.id} className="flex items-center gap-3">
                {rel.movie.posterUrl && (
                  <div className="relative h-16 w-12 flex-shrink-0 overflow-hidden rounded-lg">
                    <Image src={rel.movie.posterUrl} alt={rel.movie.title} fill className="object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{rel.movie.title}</p>
                  <p className="text-xs text-gray-500 capitalize">{rel.releaseType.toLowerCase().replace("_", " ")} · {rel.region}</p>
                </div>
                <Badge label={format(new Date(rel.releaseDate), "MMM d")} color="blue" />
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
