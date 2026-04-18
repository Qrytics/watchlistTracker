/**
 * app/page.tsx — Marketing / landing page
 *
 * Unauthenticated users land here. Authenticated users are redirected
 * to /watchlist by the middleware.
 */

import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-700 to-purple-800 flex flex-col items-center justify-center px-6 text-white">
      <div className="max-w-md w-full text-center">
        <h1 className="text-4xl font-extrabold tracking-tight mb-4">
          WatchlistTracker
        </h1>
        <p className="text-indigo-200 text-lg mb-10">
          Track your shows, movies, and get notified the moment a new episode
          drops or your favorite movie hits theatres near you.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/signup"
            className="block w-full py-3 px-6 bg-white text-indigo-700 font-semibold rounded-xl text-center hover:bg-indigo-50 transition-colors"
          >
            Get started free
          </Link>
          <Link
            href="/login"
            className="block w-full py-3 px-6 border border-indigo-400 rounded-xl text-center hover:bg-indigo-600 transition-colors"
          >
            Sign in
          </Link>
        </div>

        {/* Feature highlights */}
        <ul className="mt-12 space-y-4 text-left text-indigo-100 text-sm">
          {[
            "📺  New episode alerts the moment they air",
            "🎬  Movie release date tracking with advance notice",
            "🏥  Nearby theatre showings based on your location",
            "📰  Franchise news and social updates aggregated",
            "🔔  Web-push notifications — no app install needed",
          ].map((f) => (
            <li key={f} className="flex items-start gap-2">
              <span>{f}</span>
            </li>
          ))}
        </ul>

        <p className="mt-10 text-xs text-indigo-300">
          Works on any phone browser. Add to Home Screen for the full app
          experience.
        </p>
      </div>
    </main>
  );
}
