import { memo, type ReactElement } from "react";
import type { ArtPart } from "@/lib/peacock/types";

/** One painted shape from the original artwork. */
export const ArtPath = memo(function ArtPath({ part }: { part: ArtPart }) {
  const path = <path d={part.d} fill={part.fill} />;
  // Nested clips (none in the current artwork, kept for regenerated assets).
  return (part.clip ?? []).reduceRight<ReactElement>(
    (child, id) => <g clipPath={`url(#${id})`}>{child}</g>,
    path,
  );
});
