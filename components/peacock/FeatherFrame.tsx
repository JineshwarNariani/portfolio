"use client";

import { useRef, type ReactNode } from "react";
import { useMotionAttr } from "@/hooks/useMotionAttr";
import { peacockArt } from "@/lib/peacock/art.generated";
import type { ArtFeather } from "@/lib/peacock/types";
import { aboutPoint, type FeatherValues } from "@/lib/peacock/values";

const [PX, PY] = peacockArt.pivot;

/**
 * Two nested transforms for one feather:
 *  outer — rotation/scale about the PIVOT (the fan folding open)
 *  inner — pose about the feather's own axis midpoint (hover, detach, return)
 * At identity both are no-ops, so the feather sits exactly where the artwork put it.
 */
export function FeatherFrame({ art, values, children }: { art: ArtFeather; values: FeatherValues; children: ReactNode }) {
  const outer = useRef<SVGGElement>(null);
  const inner = useRef<SVGGElement>(null);
  const [cx, cy] = art.center;
  const v = values;
  const fold = () => aboutPoint(PX, PY, v.fold.get(), v.foldScale.get());
  const pose = () => aboutPoint(cx, cy, v.rotate.get(), v.scale.get(), v.x.get(), v.y.get());

  useMotionAttr(outer, "transform", [v.fold, v.foldScale], fold);
  useMotionAttr(outer, "opacity", [v.opacity], () => String(v.opacity.get()));
  // A fully transparent feather (folded, not yet emerged) must not catch clicks.
  const visibility = () => (v.opacity.get() < 0.01 ? "hidden" : "visible");
  useMotionAttr(outer, "visibility", [v.opacity], visibility);
  useMotionAttr(inner, "transform", [v.x, v.y, v.rotate, v.scale], pose);

  return (
    <g ref={outer} transform={fold()} opacity={v.opacity.get()} visibility={visibility()}>
      <g ref={inner} transform={pose()}>
        {children}
      </g>
    </g>
  );
}
