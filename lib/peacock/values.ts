/**
 * The peacock's animatable state as Motion values — one set per feather,
 * per backing shape, plus the scene group. Components subscribe and write SVG
 * transform attributes directly, so animation never re-renders React.
 */
import { motionValue, type MotionValue } from "motion/react";
import { animationConfig } from "@/lib/animationConfig";
import { peacockArt } from "./art.generated";
import { foldRotation, type FeatherPose, type GroupPose } from "./layout";

type MV = MotionValue<number>;

export interface FeatherValues {
  /** Rotation/scale about the PIVOT — used only by the fan opening. */
  fold: MV;
  foldScale: MV;
  /** Pose about the feather's own axis midpoint — hover, detach, return. */
  x: MV;
  y: MV;
  rotate: MV;
  scale: MV;
  opacity: MV;
  /** Eye pattern opacity (settles in after the fan opens). */
  eye: MV;
}

export interface PeacockValues {
  group: { x: MV; y: MV; scale: MV };
  body: MV;
  backerOpacity: MV;
  backers: { fold: MV; foldScale: MV; opacity: MV }[];
  feathers: FeatherValues[];
}

const folded = animationConfig.arrival.foldedScale;

export const CENTER_FEATHER = (peacockArt.feathers.length - 1) / 2;
/** Angular spacing between neighbouring feathers. */
export const FEATHER_SPACING = Math.abs(peacockArt.feathers[1].angle - peacockArt.feathers[0].angle) || 14.7;
/** Backing shapes that sit either side of the centre feather (visible while folded). */
export const isCentralBacker = (angle: number) => Math.abs(angle + 90) < FEATHER_SPACING * 0.75;

/**
 * Initial values: tail folded upright behind the body.
 *
 * Only the true centre feather (and its backing shapes) is visible while folded.
 * Every other feather is gathered on the same axis — and because the artwork
 * paints left→right, the right-hand ones would sit ON TOP of the centre and be
 * mistaken for it (then "drift" lower-right as they open). So they start
 * transparent and appear as they swing out.
 */
export function createPeacockValues(group: GroupPose): PeacockValues {
  return {
    group: { x: motionValue(group.x), y: motionValue(group.y), scale: motionValue(group.scale) },
    body: motionValue(1),
    backerOpacity: motionValue(1),
    backers: peacockArt.backers.map((b) => ({
      fold: motionValue(foldRotation(b.angle)),
      foldScale: motionValue<number>(folded),
      opacity: motionValue(isCentralBacker(b.angle) ? 1 : 0),
    })),
    feathers: peacockArt.feathers.map((f) => ({
      fold: motionValue(foldRotation(f.angle)),
      foldScale: motionValue<number>(folded),
      x: motionValue(0),
      y: motionValue(0),
      rotate: motionValue(0),
      scale: motionValue(1),
      opacity: motionValue(f.index === CENTER_FEATHER ? 1 : 0),
      eye: motionValue(0),
    })),
  };
}

export function readPose(f: FeatherValues): FeatherPose {
  return { x: f.x.get(), y: f.y.get(), rotate: f.rotate.get(), scale: f.scale.get() };
}

export function setPose(f: FeatherValues, p: FeatherPose) {
  f.x.set(p.x);
  f.y.set(p.y);
  f.rotate.set(p.rotate);
  f.scale.set(p.scale);
}

export function setGroup(v: PeacockValues, g: GroupPose) {
  v.group.x.set(g.x);
  v.group.y.set(g.y);
  v.group.scale.set(g.scale);
}

const r = (n: number) => Math.round(n * 1000) / 1000;

/** translate(P) rotate(a) scale(s) translate(−P): rotate/scale about point P. */
export function aboutPoint(px: number, py: number, rotate: number, scale: number, dx = 0, dy = 0) {
  return `translate(${r(px + dx)} ${r(py + dy)}) rotate(${r(rotate)}) scale(${r(scale)}) translate(${r(-px)} ${r(-py)})`;
}
