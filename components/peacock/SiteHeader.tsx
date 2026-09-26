import Link from "next/link";
import { profile } from "@/data/portfolioData";
import { PeacockIndex } from "./PeacockIndex";

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link href="/" className="site-name">
        {profile.name}
      </Link>
      <PeacockIndex />
    </header>
  );
}
