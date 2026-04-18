/**
 * features/notifications/NotificationsPage.tsx
 *
 * Lists notification history with mark-as-read support.
 * Also shows the Web Push permission / subscription status.
 */

"use client";

import useSWR from "swr";
import { formatDistanceToNow } from "date-fns";
import { Card, Button, Spinner, EmptyState, Badge } from "@watchlist/ui";
import { usePushSubscription } from "@/lib/push/usePushSubscription";
import type { NotificationSummary } from "@watchlist/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json()).then((d) => d.data);

const TYPE_ICON: Record<string, string> = {
  NEW_EPISODE: "📺",
  MOVIE_RELEASE: "🎬",
  THEATER_NEARBY: "🎭",
  NEWS_UPDATE: "📰",
  SOCIAL_UPDATE: "💬",
};

export function NotificationsPage() {
  const { data, isLoading, mutate } = useSWR<NotificationSummary[]>(
    "/api/notifications?limit=50",
    fetcher
  );
  const { isSubscribed, isSupported, subscribe, unsubscribe } = usePushSubscription();

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    mutate();
  }

  const unreadCount = data?.filter((n) => !n.read).length ?? 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={markAllRead}>
            Mark all read
          </Button>
        )}
      </div>

      {/* Push subscription toggle */}
      {isSupported && (
        <Card className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900">Push Notifications</p>
            <p className="text-xs text-gray-500">
              {isSubscribed ? "You're receiving push alerts on this device." : "Enable to get instant alerts."}
            </p>
          </div>
          <Button
            variant={isSubscribed ? "secondary" : "primary"}
            size="sm"
            onClick={isSubscribed ? unsubscribe : subscribe}
          >
            {isSubscribed ? "Disable" : "Enable"}
          </Button>
        </Card>
      )}

      {isLoading && (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      )}

      {!isLoading && data?.length === 0 && (
        <EmptyState
          icon={<span className="text-5xl">🔔</span>}
          title="No notifications yet"
          description="You'll see alerts here when new episodes, releases, or news arrive."
        />
      )}

      <div className="space-y-2">
        {(data ?? []).map((n) => (
          <Card
            key={n.id}
            className={n.read ? "opacity-70" : ""}
          >
            <div className="flex items-start gap-3">
              <span className="text-xl mt-0.5">{TYPE_ICON[n.type] ?? "🔔"}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{n.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{n.body}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {formatDistanceToNow(new Date(n.sentAt), { addSuffix: true })}
                </p>
              </div>
              {!n.read && <Badge label="New" color="blue" />}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
