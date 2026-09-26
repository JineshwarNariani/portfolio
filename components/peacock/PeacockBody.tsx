"use client";

import { useRef, type MouseEvent } from "react";
import type { MotionValue } from "motion/react";
import { useMotionAttr } from "@/hooks/useMotionAttr";
import { peacockArt } from "@/lib/peacock/art.generated";
import { ArtPath } from "./ArtPath";

interface Props {
  opacity: MotionValue<number>;
  onActivate: (e: MouseEvent<HTMLAnchorElement>) => void;
  onHover: (on: boolean) => void;
}

/** The chest/body — About. Not a feather: it never detaches; the camera comes to it. */
export function PeacockBody({ opacity, onActivate, onHover }: Props) {
  const ref = useRef<SVGGElement>(null);
  useMotionAttr(ref, "opacity", [opacity], () => String(opacity.get()));
  return (
    <g ref={ref} opacity={opacity.get()}>
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- SVG link, routed client-side */}
      <a
        href="/about"
        className="pk-body"
        aria-label="About — Jineshwar Nariani"
        onClick={onActivate}
        onPointerEnter={(e) => e.pointerType !== "touch" && onHover(true)}
        onPointerLeave={() => onHover(false)}
        onFocus={() => onHover(true)}
        onBlur={() => onHover(false)}
      >
        {peacockArt.body.map((p, i) => (
          <ArtPath key={i} part={p} />
        ))}
        <path className="pk-outline" d={peacockArt.bodyHit} vectorEffect="non-scaling-stroke" aria-hidden="true" />
      </a>
    </g>
  );
}
