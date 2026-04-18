/**
 * app/(dashboard)/watchlist/page.tsx
 */

import type { Metadata } from "next";
import { WatchlistPage } from "@/features/watchlist/WatchlistPage";

export const metadata: Metadata = { title: "My Watchlist" };

export default function Page() {
  return <WatchlistPage />;
}
