import type { Metadata } from "next";
import { SeoDocument } from "@/components/seo/SeoDocument";
import { pageDescriptions } from "@/data/seo";

export const metadata: Metadata = {
  title: "About — Jineshwar Nariani",
  description: pageDescriptions.about,
  alternates: { canonical: "/about" },
  openGraph: { title: "About — Jineshwar Nariani", description: pageDescriptions.about, url: "/about" },
};

// Rendered by the shared peacock layout (chest zoom); this is the text edition.
export default function About() {
  return <SeoDocument page="about" />;
}
