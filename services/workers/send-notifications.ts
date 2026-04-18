/**
 * services/workers/send-notifications.ts
 *
 * Notification dispatch worker.
 *
 * Runs periodically to detect new releases and send alerts to users
 * who are tracking the relevant content.
 *
 * Logic:
 *   1. Find EpisodeRelease rows where:
 *      - airDate is within [now - 1h, now + advanceNoticeDays * 24h]
 *      - synced = false
 *   2. For each episode, find users who have the series on their watchlist
 *      and have notifyNewEpisode = true.
 *   3. Send push + email per user's preference.
 *   4. Mark episode as synced.
 *   5. Repeat for MovieRelease rows.
 */

import { PrismaClient, NotificationType, NotificationChannel } from "@prisma/client";
import { sendPush } from "../../apps/web/lib/push/sendPush";
import { sendEmail, episodeAlertHtml, movieReleaseAlertHtml } from "../../apps/web/lib/email/sendEmail";
import { addDays, subHours, format } from "date-fns";

const db = new PrismaClient();
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function sendNotifications(): Promise<void> {
  console.log("[send-notifications] Starting…");
  await Promise.allSettled([dispatchEpisodeNotifications(), dispatchMovieNotifications()]);
  console.log("[send-notifications] Done.");
}

// ---------------------------------------------------------------------------
// Episode notifications
// ---------------------------------------------------------------------------

async function dispatchEpisodeNotifications(): Promise<void> {
  const episodes = await db.episodeRelease.findMany({
    where: {
      synced: false,
      airDate: {
        gte: subHours(new Date(), 1),
        lte: addDays(new Date(), 7), // look ahead 7 days max
      },
    },
    include: { series: true },
  });

  for (const ep of episodes) {
    // Users who track this series with episode notifications enabled
    const watchlistItems = await db.watchlistItem.findMany({
      where: { seriesId: ep.seriesId },
      include: {
        user: {
          include: {
            preference: true,
            pushSubscriptions: true,
          },
        },
      },
    });

    for (const item of watchlistItems) {
      const { user } = item;
      if (!user.preference?.notifyNewEpisode) continue;

      // Check if advance notice window applies
      const daysUntilAir = (ep.airDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      if (daysUntilAir > (user.preference.advanceNoticeDays + 1)) continue;

      const title = `📺 ${ep.series.title}`;
      const body = `S${String(ep.season).padStart(2, "0")}E${String(ep.episode).padStart(2, "0")}${ep.title ? ` — ${ep.title}` : ""} airs ${format(ep.airDate, "MMM d")}`;

      await notifyUser({
        userId: user.id,
        type: "NEW_EPISODE",
        title,
        body,
        url: `${APP_URL}/releases`,
        pushEnabled: user.preference.pushEnabled,
        emailEnabled: user.preference.emailEnabled,
        email: user.email,
        pushSubscriptions: user.pushSubscriptions,
        emailHtml: episodeAlertHtml({
          seriesTitle: ep.series.title,
          season: ep.season,
          episode: ep.episode,
          episodeTitle: ep.title,
          airDate: format(ep.airDate, "MMMM d, yyyy"),
          appUrl: APP_URL,
        }),
      });
    }

    // Mark as synced regardless of whether any users were notified
    await db.episodeRelease.update({ where: { id: ep.id }, data: { synced: true } });
  }
}

// ---------------------------------------------------------------------------
// Movie release notifications
// ---------------------------------------------------------------------------

async function dispatchMovieNotifications(): Promise<void> {
  const releases = await db.movieRelease.findMany({
    where: {
      synced: false,
      releaseDate: {
        gte: subHours(new Date(), 1),
        lte: addDays(new Date(), 7),
      },
    },
    include: { movie: true },
  });

  for (const rel of releases) {
    const watchlistItems = await db.watchlistItem.findMany({
      where: { movieId: rel.movieId },
      include: {
        user: {
          include: { preference: true, pushSubscriptions: true },
        },
      },
    });

    for (const item of watchlistItems) {
      const { user } = item;
      if (!user.preference?.notifyMovieRelease) continue;

      const daysUntil = (rel.releaseDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      if (daysUntil > (user.preference.advanceNoticeDays + 1)) continue;

      const title = `🎬 ${rel.movie.title}`;
      const body = `Releasing ${format(rel.releaseDate, "MMM d")} (${rel.releaseType.toLowerCase().replace("_", " ")}, ${rel.region})`;

      await notifyUser({
        userId: user.id,
        type: "MOVIE_RELEASE",
        title,
        body,
        url: `${APP_URL}/releases`,
        pushEnabled: user.preference.pushEnabled,
        emailEnabled: user.preference.emailEnabled,
        email: user.email,
        pushSubscriptions: user.pushSubscriptions,
        emailHtml: movieReleaseAlertHtml({
          movieTitle: rel.movie.title,
          releaseDate: format(rel.releaseDate, "MMMM d, yyyy"),
          releaseType: rel.releaseType,
          appUrl: APP_URL,
        }),
      });
    }

    await db.movieRelease.update({ where: { id: rel.id }, data: { synced: true } });
  }
}

// ---------------------------------------------------------------------------
// Shared send helper
// ---------------------------------------------------------------------------

interface NotifyUserOpts {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  url: string;
  pushEnabled: boolean;
  emailEnabled: boolean;
  email: string;
  pushSubscriptions: Array<{ id: string; endpoint: string; p256dh: string; auth: string }>;
  emailHtml: string;
}

async function notifyUser(opts: NotifyUserOpts): Promise<void> {
  const channels: NotificationChannel[] = [];

  // Push
  if (opts.pushEnabled && opts.pushSubscriptions.length > 0) {
    for (const sub of opts.pushSubscriptions) {
      const ok = await sendPush(
        { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
        { title: opts.title, body: opts.body, url: opts.url }
      );
      // If subscription is expired, delete it
      if (!ok) {
        await db.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
      }
    }
    channels.push("PUSH");
  }

  // Email
  if (opts.emailEnabled) {
    await sendEmail({
      to: opts.email,
      subject: opts.title,
      html: opts.emailHtml,
    });
    channels.push("EMAIL");
  }

  // Log in-app notification (always)
  await db.notification.create({
    data: {
      userId: opts.userId,
      type: opts.type,
      title: opts.title,
      body: opts.body,
      url: opts.url,
      channel: channels[0] ?? "IN_APP",
    },
  });
}
