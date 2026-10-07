import type { MetadataRoute } from "next";
import { SECTION_IDS } from "@/data/featherConfig";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["", "/about", "/quick-view", ...SECTION_IDS.map((s) => `/${s}`), "/privacy"];
  const lastModified = new Date();
  return paths.map((p) => ({ url: `${SITE_URL}${p || "/"}`, lastModified, priority: p === "" ? 1 : p === "/privacy" ? 0.3 : 0.7 }));
}
