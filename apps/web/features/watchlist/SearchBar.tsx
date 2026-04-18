/**
 * features/watchlist/SearchBar.tsx
 *
 * Search input that queries /api/search and lets the user
 * add a result directly to their watchlist.
 */

"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Spinner } from "@watchlist/ui";
import type { SearchResult, WatchlistItemType } from "@watchlist/types";

interface SearchBarProps {
  onAdd: () => void;
}

export function SearchBar({ onAdd }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) { setResults([]); return; }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const json = await res.json();
        setResults(json.data ?? []);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, [query]);

  async function handleAdd(result: SearchResult) {
    setAdding(result.id);
    const itemType: WatchlistItemType = result.type === "movie" ? "MOVIE" : "SERIES";
    await fetch("/api/watchlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itemType,
        ...(itemType === "SERIES" ? { seriesId: result.id } : { movieId: result.id }),
      }),
    });
    setAdding(null);
    setQuery("");
    setResults([]);
    onAdd();
  }

  return (
    <div className="relative">
      <input
        type="search"
        placeholder="Search for a show or movie..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      {loading && (
        <div className="absolute right-3 top-3">
          <Spinner size="sm" />
        </div>
      )}

      {results.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full rounded-xl bg-white shadow-lg ring-1 ring-gray-200 max-h-72 overflow-y-auto">
          {results.map((r) => (
            <li key={r.id}>
              <button
                onClick={() => handleAdd(r)}
                disabled={adding === r.id}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 disabled:opacity-50"
              >
                {r.posterUrl ? (
                  <Image
                    src={r.posterUrl}
                    alt={r.title}
                    width={32}
                    height={48}
                    className="rounded object-cover"
                  />
                ) : (
                  <div className="h-12 w-8 rounded bg-gray-200 flex items-center justify-center text-xs text-gray-400">?</div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900">{r.title}</p>
                  <p className="text-xs text-gray-500 capitalize">{r.type}</p>
                </div>
                {adding === r.id && <Spinner size="sm" className="ml-auto" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
