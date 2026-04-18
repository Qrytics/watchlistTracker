/**
 * app/(dashboard)/theaters/page.tsx
 */

import type { Metadata } from "next";
import { TheatersPage } from "@/features/theaters/TheatersPage";

export const metadata: Metadata = { title: "Theaters Near You" };

export default function Page() {
  return <TheatersPage />;
}
