import type { Metadata } from "next";
import { QuickView } from "@/components/recruiter/QuickView";
import { pageDescriptions } from "@/data/seo";

export const metadata: Metadata = {
  title: "Quick View — Jineshwar Nariani",
  description: pageDescriptions.quickView,
  alternates: { canonical: "/quick-view" },
  openGraph: { title: "Quick View — Jineshwar Nariani", description: pageDescriptions.quickView, url: "/quick-view" },
};

export default function QuickViewPage() {
  return <QuickView />;
}
