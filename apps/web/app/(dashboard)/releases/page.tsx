/**
 * app/(dashboard)/releases/page.tsx
 */

import type { Metadata } from "next";
import { ReleasesPage } from "@/features/releases/ReleasesPage";

export const metadata: Metadata = { title: "Upcoming Releases" };

export default function Page() {
  return <ReleasesPage />;
}
