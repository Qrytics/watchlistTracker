/**
 * components/TopBar.tsx
 *
 * Fixed top app bar showing the app name, search icon, and user avatar.
 * On mobile this is narrow — keep it minimal.
 */

"use client";

import Link from "next/link";
import { Avatar } from "@watchlist/ui";
import type { AuthUser } from "@watchlist/types";

interface TopBarProps {
  user: AuthUser | null | undefined;
}

export function TopBar({ user }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between bg-white px-4 shadow-sm border-b border-gray-200">
      <Link href="/watchlist" className="text-lg font-extrabold text-indigo-600 tracking-tight">
        WatchList
      </Link>

      <div className="flex items-center gap-3">
        <Link href="/settings" aria-label="Settings">
          <Avatar src={user?.image} name={user?.name} size="sm" />
        </Link>
      </div>
    </header>
  );
}
