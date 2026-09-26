/**
 * Pure geometry: where the peacock sits and where a detached feather travels,
 * for a given viewport. All results are in the units the scene animates:
 * the peacock group in screen px, feather poses in art units.
 */
import { animationConfig } from "@/lib/animationConfig";
import { peacockArt } from "./art.generated";
import type { ArtFeather } from "./types";

export type Mode = "mobile" | "tablet" | "desktop";

export interface Viewport {
  w: number;
  h: number;
}

/** Art → screen: screen = (x, y) + scale · art. */
export interface GroupPose {
  x: number;
  y: number;
  scale: number;
}

/** A feather's own transform around its axis midpoint, art units. Identity = its place in the fan. */
export interface FeatherPose {
  x: number;
  y: number;
  rotate: number;
  scale: number;
}

export const IDENTITY: FeatherPose = { x: 0, y: 0, rotate: 0, scale: 1 };

/** Height reserved for the header. */
export const HEADER = 64;

export function modeFor(vp: Viewport): Mode {
  if (vp.w < 700) return "mobile";
  if (vp.w < 1024) return "tablet";
  return "desktop";
}

const [BX, BY, BW, BH] = peacockArt.box;

function place(scale: number, cx: number, cy: number, ax: number, ay: number): GroupPose {
  return { x: cx - scale * ax, y: cy - scale * ay, scale };
}

/** Idle: the whole peacock centred on the canvas (top half on mobile). */
export function fitPose(vp: Viewport): GroupPose {
  const mode = modeFor(vp);
  if (mode === "mobile") {
    // Resting: centred in the space below the header. It rises to the top when a section opens.
    const s = Math.min((0.94 * vp.w) / BW, (0.4 * vp.h) / BH);
    return place(s, vp.w / 2, HEADER + (vp.h - HEADER) * 0.42, BX + BW / 2, BY + BH / 2);
  }
  const s = Math.min((0.78 * vp.w) / BW, (0.66 * vp.h) / BH);
  return place(s, vp.w / 2, vp.h * 0.5 + 8, BX + BW / 2, BY + BH / 2);
}

/** Section open: the peacock steps back to make room for the content. */
export function sectionGroupPose(vp: Viewport): GroupPose {
  const fit = fitPose(vp);
  const mode = modeFor(vp);
  if (mode === "mobile") {
    // Top band above the content sheet.
    const s = fit.scale * 0.8;
    return place(s, vp.w / 2, HEADER + (BH * s) / 2 + 4, BX + BW / 2, BY + BH / 2);
  }
  const s = fit.scale * (mode === "tablet" ? 0.62 : 0.72);
  return place(s, vp.w * (mode === "tablet" ? 0.25 : 0.26), vp.h * 0.54, BX + BW / 2, BY + BH / 2);
}

/** About: the camera moves in on the chest; the tail leaves the frame. */
export function aboutGroupPose(vp: Viewport): GroupPose {
  const fit = fitPose(vp);
  const mode = modeFor(vp);
  const [cx, cy] = peacockArt.chest;
  if (mode === "mobile") {
    const s = fit.scale * animationConfig.about.zoomScaleMobile;
    return place(s, vp.w / 2, HEADER + vp.h * 0.16, cx, cy);
  }
  const s = fit.scale * animationConfig.about.zoomScale;
  return place(s, vp.w * (mode === "tablet" ? 0.25 : 0.28), vp.h * 0.52, cx, cy);
}

const normalize = (deg: number) => ((((deg + 180) % 360) + 360) % 360) - 180;

/**
 * Where the selected feather rests while its section is open: standing
 * upright beside the content (desktop/tablet) or lying across the top (mobile).
 * Returned as a pose relative to the feather's ORIGINAL placement.
 */
export function detachedPose(vp: Viewport, feather: ArtFeather, group: GroupPose): FeatherPose {
  const mode = modeFor(vp);
  let tx: number, ty: number, angle: number, length: number;
  if (mode === "mobile") {
    angle = 0;
    length = Math.min(vp.w * 0.78, 360);
    tx = vp.w / 2;
    ty = HEADER + vp.h * 0.13;
  } else {
    angle = -90;
    length = Math.min(vp.h * 0.64, mode === "tablet" ? 380 : 470);
    tx = vp.w * (mode === "tablet" ? 0.25 : 0.26);
    ty = vp.h * 0.53;
  }
  const scale = length / feather.reach / group.scale;
  const [cx, cy] = feather.center;
  return {
    x: (tx - group.x) / group.scale - cx,
    y: (ty - group.y) / group.scale - cy,
    rotate: normalize(angle - feather.angle),
    scale,
  };
}

/** Unit vector along a feather's axis (outward from the pivot). */
export function axis(feather: { angle: number }): [number, number] {
  const a = (feather.angle * Math.PI) / 180;
  return [Math.cos(a), Math.sin(a)];
}

/** Straight outward along the axis by `px` screen pixels. */
export function outward(feather: { angle: number }, px: number, group: GroupPose): FeatherPose {
  const [dx, dy] = axis(feather);
  return { x: (dx * px) / group.scale, y: (dy * px) / group.scale, rotate: 0, scale: 1 };
}

/** Rotation that gathers a feather (or backer) upright behind the body, for the folded tail. */
export function foldRotation(angle: number): number {
  return normalize(-90 - angle);
}

/** Art point → screen px. */
export function toScreen(group: GroupPose, [x, y]: readonly [number, number]): [number, number] {
  return [group.x + group.scale * x, group.y + group.scale * y];
}
