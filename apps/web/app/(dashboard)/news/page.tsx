/**
 * app/(dashboard)/news/page.tsx
 */

import type { Metadata } from "next";
import { NewsPage } from "@/features/news/NewsPage";

export const metadata: Metadata = { title: "News & Updates" };

export default function Page() {
  return <NewsPage />;
}
