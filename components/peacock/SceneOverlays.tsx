"use client";

import { useLayoutEffect, useRef } from "react";
import { interactiveFeathers, type FeatherId } from "@/data/featherConfig";
import { animationConfig } from "@/lib/animationConfig";
import { peacockArt } from "@/lib/peacock/art.generated";
import { axis, toScreen, type GroupPose } from "@/lib/peacock/layout";

/**
 * Hover/focus labels. Each sits just beyond its feather's tip, outside the fan,
 * so it never covers the artwork. Only the active one is visible. On narrow
 * screens all titles share the slot above the centre feather.
 */
export function FeatherLabel({ id, group, compact }: { id: FeatherId | null; group: GroupPose; compact: boolean }) {
  const box = useRef<HTMLDivElement>(null);

  // On narrow screens a side feather's tip is near the edge: nudge the visible
  // title sideways just enough to keep it fully on screen.
  useLayoutEffect(() => {
    const el = box.current?.querySelector<HTMLElement>(`[data-id="${id}"]`);
    if (!el) return;
    el.style.marginLeft = "0px";
    const r = el.getBoundingClientRect();
    const margin = 12;
    const shift = r.left < margin ? margin - r.left : r.right > window.innerWidth - margin ? window.innerWidth - margin - r.right : 0;
    el.style.marginLeft = `${shift}px`;
  }, [id, group, compact]);

  return (
    <div className="labels" aria-hidden="true" ref={box}>
      {interactiveFeathers.map((f) => {
        // On narrow screens the fan fills the width, so every title shares one
        // slot above the centre feather instead of crowding a side feather's tip.
        const art = peacockArt.feathers[compact ? CENTRE_INDEX : f.featherIndex];
        const [dx, dy] = axis(art);
        const [tx, ty] = toScreen(group, art.tip);
        const gap = animationConfig.hover.offset + 14;
        const align = dx < -0.35 ? "end" : dx > 0.35 ? "start" : "center";
        return (
          <div
            key={f.id}
            data-id={f.id}
            className="label"
            data-visible={id === f.id || undefined}
            data-align={align}
            data-above={dy < -0.5 || undefined}
            style={{ left: tx + dx * gap, top: ty + dy * gap }}
          >
            <span className="label-main">{f.label}</span>
            <span className="label-micro">{f.microLabel}</span>
          </div>
        );
      })}
    </div>
  );
}

const CENTRE_INDEX = interactiveFeathers.find((f) => f.id === "founder")!.featherIndex;

export type CueMode = "select" | "about" | null;

/**
 * The single quiet line beneath the peacock's feet: "Pluck a feather" whenever
 * the peacock is at rest, replaced by "About" only while the chest is hovered/focused.
 */
export function SceneCue({ mode, group }: { mode: CueMode; group: GroupPose }) {
  const [x, y] = toScreen(group, peacockArt.feet);
  return (
    <p className="cue" data-mode={mode ?? undefined} style={{ left: x, top: y + 22 }}>
      <span className="cue-select" aria-hidden={mode !== "select"}>
        Pluck a feather
      </span>
      <span className="cue-about" aria-hidden="true">
        About
      </span>
    </p>
  );
}
