/**
 * components/BottomNav.tsx
 *
 * Mobile-first bottom navigation bar — pinned to the bottom of the screen.
 * Highlights the active route.
 *
 * This is the primary navigation for the app (phone-first).
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/watchlist",      icon: "📺", label: "Watchlist"    },
  { href: "/releases",       icon: "📅", label: "Releases"     },
  { href: "/theaters",       icon: "🎭", label: "Theatres"     },
  { href: "/news",           icon: "📰", label: "News"         },
  { href: "/notifications",  icon: "🔔", label: "Alerts"       },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-30 flex h-16 items-center justify-around bg-white border-t border-gray-200 pb-safe"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {NAV_ITEMS.map(({ href, icon, label }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={[
              "flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors",
              active ? "text-indigo-600" : "text-gray-400 hover:text-gray-700",
            ].join(" ")}
            aria-current={active ? "page" : undefined}
          >
            <span className="text-xl leading-none">{icon}</span>
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
