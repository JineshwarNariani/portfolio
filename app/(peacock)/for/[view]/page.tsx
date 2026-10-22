import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { QuickView } from "@/components/recruiter/QuickView";
import { isViewId, VIEW_IDS, VIEWS_ENABLED, views } from "@/data/views";

export const dynamicParams = false;

export function generateStaticParams() {
  return VIEWS_ENABLED ? VIEW_IDS.map((view) => ({ view })) : [];
}

export async function generateMetadata({ params }: { params: Promise<{ view: string }> }): Promise<Metadata> {
  const { view } = await params;
  if (!VIEWS_ENABLED || !isViewId(view)) return {};
  const title = `${views[view].label} — Jineshwar Nariani`;
  const { description } = views[view];
  return { title, description, alternates: { canonical: `/for/${view}` }, openGraph: { title, description, url: `/for/${view}` } };
}

/** Quick View filtered for one audience (shareable: /for/research, /for/engineering, /for/fde). */
export default async function ViewPage({ params }: { params: Promise<{ view: string }> }) {
  const { view } = await params;
  if (!VIEWS_ENABLED || !isViewId(view)) notFound();
  return <QuickView view={view} />;
}
