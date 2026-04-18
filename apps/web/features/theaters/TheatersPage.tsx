/**
 * features/theaters/TheatersPage.tsx
 *
 * Shows theater showings for watchlisted movies near the user's location.
 * Prompts the user to save a location if none is set.
 */

"use client";

import useSWR from "swr";
import { format } from "date-fns";
import { Card, Badge, Spinner, EmptyState, Button } from "@watchlist/ui";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((r) => r.json()).then((d) => d.data);

export function TheatersPage() {
  const { data: settings } = useSWR("/api/settings", fetcher);
  const hasLocation = !!settings?.location;

  const { data: showings, isLoading } = useSWR(
    hasLocation ? "/api/theaters?days=14" : null,
    fetcher
  );

  if (!settings) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!hasLocation) {
    return (
      <EmptyState
        icon={<span className="text-5xl">🗺️</span>}
        title="No location saved"
        description="Save your location in Settings so we can show nearby theatre showings."
        action={
          <Link href="/settings">
            <Button>Go to Settings</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Theaters Near You</h1>
        <Link href="/settings" className="text-xs text-indigo-600 hover:underline">
          Change location
        </Link>
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      )}

      {!isLoading && showings?.length === 0 && (
        <EmptyState
          icon={<span className="text-5xl">🎭</span>}
          title="No nearby showings found"
          description="There are no upcoming showings for your watchlisted movies within your search radius."
          action={
            <Link href="/settings">
              <Button variant="secondary">Expand radius</Button>
            </Link>
          }
        />
      )}

      {(showings ?? []).map((s: {
        id: string;
        theaterName: string;
        theaterAddress?: string;
        showtime: string;
        ticketUrl?: string;
        distanceKm?: number;
        movie: { title: string };
      }) => (
        <Card key={s.id} className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-gray-900">{s.movie.title}</p>
              <p className="text-xs text-gray-600 mt-0.5">{s.theaterName}</p>
              {s.theaterAddress && (
                <p className="text-xs text-gray-400">{s.theaterAddress}</p>
              )}
            </div>
            {s.distanceKm !== undefined && (
              <Badge label={`${s.distanceKm.toFixed(1)} km`} color="gray" />
            )}
          </div>
          <div className="flex items-center justify-between">
            <Badge label={format(new Date(s.showtime), "EEE MMM d, h:mm a")} color="blue" />
            {s.ticketUrl && (
              <a
                href={s.ticketUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-indigo-600 hover:underline"
              >
                Buy tickets →
              </a>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
