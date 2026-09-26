"use client";

import type { ArtFeather } from "@/lib/peacock/types";
import type { FeatherValues } from "@/lib/peacock/values";
import { FeatherArt } from "./FeatherArt";
import { FeatherFrame } from "./FeatherFrame";

/** A feather that only takes part in the opening — not navigation. */
export function DecorativeFeather({ art, values }: { art: ArtFeather; values: FeatherValues }) {
  return (
    <FeatherFrame art={art} values={values}>
      <g className="pk-decorative" aria-hidden="true">
        <FeatherArt art={art} eye={values.eye} />
      </g>
    </FeatherFrame>
  );
}
