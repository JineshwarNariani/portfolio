"use client";

import type { FocusEvent, MouseEvent, PointerEvent } from "react";
import type { InteractiveFeather as Spec } from "@/data/featherConfig";
import type { ArtFeather } from "@/lib/peacock/types";
import type { FeatherValues } from "@/lib/peacock/values";
import { FeatherArt } from "./FeatherArt";
import { FeatherFrame } from "./FeatherFrame";

interface Props {
  spec: Spec;
  art: ArtFeather;
  values: FeatherValues;
  onActivate: (e: MouseEvent<HTMLAnchorElement>) => void;
  onHover: (on: boolean) => void;
}

/**
 * A section feather. It is a real link (keyboard focusable, works without the
 * animation, opens in a new tab with ⌘/Ctrl-click) whose artwork is the feather itself.
 */
export function InteractiveFeather({ spec, art, values, onActivate, onHover }: Props) {
  const enter = (e: PointerEvent | FocusEvent) => {
    if ("pointerType" in e && e.pointerType === "touch") return;
    onHover(true);
  };
  return (
    <FeatherFrame art={art} values={values}>
      {/* SVG <a>: next/link cannot wrap SVG content; navigation is client-side via onActivate. */}
      <a
        href={spec.href}
        className="pk-feather"
        aria-label={`${spec.label} — ${spec.microLabel}`}
        data-section={spec.id}
        onClick={onActivate}
        onPointerEnter={enter}
        onPointerLeave={() => onHover(false)}
        onFocus={enter}
        onBlur={() => onHover(false)}
      >
        <FeatherArt art={art} eye={values.eye} />
        <g className="pk-outline" aria-hidden="true">
          {art.hit.map((d, i) => (
            <path key={i} d={d} vectorEffect="non-scaling-stroke" />
          ))}
        </g>
      </a>
    </FeatherFrame>
  );
}
