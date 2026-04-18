/**
 * app/(dashboard)/layout.tsx — Dashboard layout
 *
 * Wraps every authenticated page.
 * Contains the top header and the mobile bottom navigation bar.
 * Content area scrolls independently.
 */

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/authOptions";
import { BottomNav } from "@/components/BottomNav";
import { TopBar } from "@/components/TopBar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <TopBar user={session.user} />
      <main className="flex-1 overflow-y-auto page-content">{children}</main>
      <BottomNav />
    </div>
  );
}
