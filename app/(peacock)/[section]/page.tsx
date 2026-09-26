import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { featherById, isFeatherId, SECTION_IDS } from "@/data/featherConfig";

export const dynamicParams = false;

export function generateStaticParams() {
  return SECTION_IDS.map((section) => ({ section }));
}

export async function generateMetadata({ params }: { params: Promise<{ section: string }> }): Promise<Metadata> {
  const { section } = await params;
  if (!isFeatherId(section)) return {};
  return { title: `${featherById[section].label} — Jineshwar Nariani` };
}

// Rendered by the shared peacock layout (feather detaches into this section).
export default async function Section({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!isFeatherId(section)) notFound();
  return null;
}
