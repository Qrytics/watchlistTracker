/**
 * app/(auth)/layout.tsx — Auth layout
 *
 * Centered card layout used by /login and /signup.
 * No navigation bar — unauthenticated context.
 */

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="text-2xl font-extrabold text-indigo-600 tracking-tight">
            WatchlistTracker
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}
