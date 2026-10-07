import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SeoDocument } from "@/components/seo/SeoDocument";
import { featherById, isFeatherId, SECTION_IDS } from "@/data/featherConfig";
import { pageDescriptions } from "@/data/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return SECTION_IDS.map((section) => ({ section }));
}

export async function generateMetadata({ params }: { params: Promise<{ section: string }> }): Promise<Metadata> {
  const { section } = await params;
  if (!isFeatherId(section)) return {};
  const title = `${featherById[section].label} — Jineshwar Nariani`;
  const description = pageDescriptions[section];
  return {
    title,
    description,
    alternates: { canonical: `/${section}` },
    openGraph: { title, description, url: `/${section}` },
  };
}

// The peacock lives in the shared layout (the feather detaches into this section);
// this renders the page's server-side text edition.
export default async function Section({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!isFeatherId(section)) notFound();
  return <SeoDocument page={section} />;
}
