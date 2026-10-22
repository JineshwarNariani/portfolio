import type { MetadataRoute } from "next";
import { SECTION_IDS } from "@/data/featherConfig";
import { VIEW_IDS, VIEWS_ENABLED } from "@/data/views";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const viewPaths = VIEWS_ENABLED ? VIEW_IDS.map((v) => `/for/${v}`) : [];
  const paths = ["", "/about", "/quick-view", ...viewPaths, ...SECTION_IDS.map((s) => `/${s}`), "/privacy"];
  const lastModified = new Date();
  return paths.map((p) => ({ url: `${SITE_URL}${p || "/"}`, lastModified, priority: p === "" ? 1 : p === "/privacy" ? 0.3 : 0.7 }));
}
