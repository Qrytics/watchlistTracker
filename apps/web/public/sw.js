/**
 * public/sw.js — Service Worker
 *
 * Responsibilities:
 *  1. Cache the app shell (navigation / static assets) for offline use.
 *  2. Handle incoming Web Push notifications.
 *  3. Handle notification click — open / focus the correct page.
 *
 * Caching strategy:
 *  - Navigation requests → network-first, fallback to cached shell.
 *  - Static assets (JS/CSS/fonts) → stale-while-revalidate.
 *  - API requests → network-only (never cache live data).
 *
 * NOTE: This file is intentionally plain JavaScript (no TypeScript / bundler)
 * because service workers must be served as a raw script from the origin root.
 */

const CACHE_NAME = "watchlist-v1";

const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/offline.html",
];

// ---- Install ----------------------------------------------------------------

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  // Activate immediately without waiting for old tabs to close.
  self.skipWaiting();
});

// ---- Activate ---------------------------------------------------------------

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  // Claim all existing clients immediately.
  self.clients.claim();
});

// ---- Fetch ------------------------------------------------------------------

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests.
  if (url.origin !== self.location.origin) return;

  // Skip API routes — always go to the network.
  if (url.pathname.startsWith("/api/")) return;

  // Navigation requests: network-first with offline fallback.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match("/offline.html").then((r) => r ?? new Response("Offline", { status: 503 }))
      )
    );
    return;
  }

  // Static assets: stale-while-revalidate.
  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request).then((response) => {
        if (response.ok) {
          caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
        }
        return response;
      });
      return cached ?? networkFetch;
    })
  );
});

// ---- Push -------------------------------------------------------------------

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "WatchlistTracker", body: event.data.text(), url: "/" };
  }

  event.waitUntil(
    self.registration.showNotification(payload.title ?? "WatchlistTracker", {
      body: payload.body ?? "",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: payload.url ?? "/" },
      vibrate: [200, 100, 200],
    })
  );
});

// ---- Notification click -----------------------------------------------------

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url ?? "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        // If a matching window is already open, focus it.
        const match = clients.find((c) => c.url === targetUrl);
        if (match) return match.focus();
        // Otherwise open a new window/tab.
        return self.clients.openWindow(targetUrl);
      })
  );
});
