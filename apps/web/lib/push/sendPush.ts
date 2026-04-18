/**
 * lib/push/sendPush.ts
 *
 * Server-side helper that sends a Web Push notification to a single
 * PushSubscription record from the database.
 *
 * Uses the `web-push` npm package under the hood.
 * VAPID credentials are loaded from environment variables.
 */

import webPush from "web-push";

webPush.setVapidDetails(
  process.env.VAPID_SUBJECT ?? "mailto:admin@example.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "",
  process.env.VAPID_PRIVATE_KEY ?? ""
);

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

export interface PushTarget {
  endpoint: string;
  p256dh: string;
  auth: string;
}

/**
 * Send a push notification to a single subscription.
 *
 * Returns `true` on success, `false` if the subscription is expired/invalid
 * (caller should delete it from the database).
 */
export async function sendPush(target: PushTarget, payload: PushPayload): Promise<boolean> {
  try {
    await webPush.sendNotification(
      {
        endpoint: target.endpoint,
        keys: { p256dh: target.p256dh, auth: target.auth },
      },
      JSON.stringify(payload)
    );
    return true;
  } catch (err: unknown) {
    const status = (err as { statusCode?: number }).statusCode;
    // 404 / 410 = subscription is gone — remove it
    if (status === 404 || status === 410) return false;
    console.error("[sendPush] Error:", err);
    return false;
  }
}
