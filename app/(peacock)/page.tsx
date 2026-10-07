import type { Metadata } from "next";
import { SeoDocument } from "@/components/seo/SeoDocument";
import { pageDescriptions } from "@/data/seo";

export const metadata: Metadata = {
  description: pageDescriptions.home,
  alternates: { canonical: "/" },
  openGraph: { url: "/", description: pageDescriptions.home },
};

// The peacock itself lives in the shared layout; "/" is its resting state.
export default function Home() {
  return <SeoDocument page="home" />;
}
