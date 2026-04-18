/**
 * components/ServiceWorkerRegistrar.tsx
 *
 * Client component that registers the service worker on first load.
 * Must be a client component because it accesses `navigator`.
 *
 * Placed in the root layout so it runs on every page.
 */

"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("[SW] Registered:", reg.scope);
        })
        .catch((err) => {
          console.warn("[SW] Registration failed:", err);
        });
    }
  }, []);

  return null;
}
