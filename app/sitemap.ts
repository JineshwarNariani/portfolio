import type { MetadataRoute } from "next";
import { SECTION_IDS } from "@/data/featherConfig";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["", "/about", "/quick-view", ...SECTION_IDS.map((s) => `/${s}`), "/privacy"];
  return paths.map((p) => ({ url: `${SITE_URL}${p}`, priority: p === "" ? 1 : 0.7 }));
}
