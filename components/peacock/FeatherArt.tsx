"use client";

import { memo, useRef } from "react";
import type { MotionValue } from "motion/react";
import { useMotionAttr } from "@/hooks/useMotionAttr";
import type { ArtFeather } from "@/lib/peacock/types";
import { ArtPath } from "./ArtPath";

/** The original feather artwork: blade layers, then the eye (which fades in last). */
export const FeatherArt = memo(function FeatherArt({ art, eye }: { art: ArtFeather; eye: MotionValue<number> }) {
  const eyeRef = useRef<SVGGElement>(null);
  useMotionAttr(eyeRef, "opacity", [eye], () => String(eye.get()));
  return (
    <>
      {art.blade.map((p, i) => (
        <ArtPath key={i} part={p} />
      ))}
      <g ref={eyeRef} opacity={eye.get()}>
        {art.eyeParts.map((p, i) => (
          <ArtPath key={i} part={p} />
        ))}
      </g>
    </>
  );
});
