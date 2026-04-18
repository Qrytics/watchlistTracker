/**
 * lib/email/sendEmail.ts
 *
 * Server-side helper that sends a transactional email via Resend.
 *
 * Usage:
 *   await sendEmail({
 *     to: "user@example.com",
 *     subject: "New episode of Loki!",
 *     html: "<p>Season 3, Episode 1 airs tonight.</p>",
 *   });
 */

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send a transactional email.
 * Returns `true` on success, `false` on failure.
 */
export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  try {
    const from = process.env.EMAIL_FROM ?? "notifications@watchlisttracker.app";
    await resend.emails.send({
      from,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    });
    return true;
  } catch (err) {
    console.error("[sendEmail] Error:", err);
    return false;
  }
}

// ---- Email templates -------------------------------------------------------

export function episodeAlertHtml(opts: {
  seriesTitle: string;
  season: number;
  episode: number;
  episodeTitle?: string | null;
  airDate: string;
  appUrl: string;
}): string {
  return `
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:auto;padding:24px;">
      <h1 style="font-size:1.25rem;font-weight:700;color:#111827;">📺 New Episode Alert</h1>
      <p style="color:#374151;">
        <strong>${opts.seriesTitle}</strong> S${String(opts.season).padStart(2, "0")}E${String(opts.episode).padStart(2, "0")}
        ${opts.episodeTitle ? `— ${opts.episodeTitle}` : ""} airs on <strong>${opts.airDate}</strong>.
      </p>
      <a href="${opts.appUrl}/releases" style="display:inline-block;margin-top:16px;background:#4f46e5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">
        View releases
      </a>
    </div>
  `;
}

export function movieReleaseAlertHtml(opts: {
  movieTitle: string;
  releaseDate: string;
  releaseType: string;
  appUrl: string;
}): string {
  return `
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:auto;padding:24px;">
      <h1 style="font-size:1.25rem;font-weight:700;color:#111827;">🎬 Movie Release Alert</h1>
      <p style="color:#374151;">
        <strong>${opts.movieTitle}</strong> is releasing on <strong>${opts.releaseDate}</strong>
        (${opts.releaseType.toLowerCase().replace("_", " ")}).
      </p>
      <a href="${opts.appUrl}/releases" style="display:inline-block;margin-top:16px;background:#4f46e5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">
        View releases
      </a>
    </div>
  `;
}
