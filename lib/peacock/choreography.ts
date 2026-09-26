/**
 * Choreography: each state-machine transition as an awaitable sequence.
 * The scene dispatches the completion event when a sequence resolves.
 */
import { animate, type MotionValue } from "motion/react";
import { animationConfig as cfg } from "@/lib/animationConfig";
import { peacockArt } from "./art.generated";
import {
  aboutGroupPose,
  detachedPose,
  fitPose,
  IDENTITY,
  outward,
  sectionGroupPose,
  type GroupPose,
  type Viewport,
} from "./layout";
import { CENTER_FEATHER, FEATHER_SPACING, setGroup, setPose, type PeacockValues } from "./values";

type Ease = readonly [number, number, number, number];

interface Tween {
  duration: number;
  delay?: number;
  ease?: Ease;
}

function to(mv: MotionValue<number>, value: number, t: Tween): Promise<void> {
  return new Promise((resolve) => {
    animate(mv, value, { duration: t.duration, delay: t.delay ?? 0, ease: t.ease ? [...t.ease] : "easeInOut" }).then(
      () => resolve(),
    );
  });
}

const wait = (s: number) => new Promise<void>((r) => setTimeout(r, s * 1000));

function groupTo(v: PeacockValues, g: GroupPose, t: Tween) {
  return Promise.all([to(v.group.x, g.x, t), to(v.group.y, g.y, t), to(v.group.scale, g.scale, t)]);
}


export interface Context {
  vp: Viewport;
  reduced: boolean;
  /** Set when the sequence is superseded (e.g. unmount); later phases are skipped. */
  token?: { cancelled: boolean };
}

const cancelled = (ctx: Context) => ctx.token?.cancelled === true;

// ---------------------------------------------------------------------------
// Arrival: the fan opens from the centre outward, in symmetric pairs.
// ---------------------------------------------------------------------------
export async function openTail(v: PeacockValues, ctx: Context & { short: boolean }) {
  const a = cfg.arrival;
  if (ctx.reduced) {
    // Simplified: the open fan fades in; no swing.
    const fade = { duration: cfg.reduced.arrivalFade };
    v.feathers.forEach((f) => {
      f.fold.set(0);
      f.foldScale.set(1);
      f.eye.set(1);
    });
    v.backers.forEach((b) => {
      b.fold.set(0);
      b.foldScale.set(1);
    });
    await Promise.all([...v.feathers.map((f) => to(f.opacity, 1, fade)), ...v.backers.map((b) => to(b.opacity, 1, fade))]);
    return;
  }
  const k = ctx.short ? a.shortFactor : 1;
  const open = (ring: number): Tween => ({ duration: a.duration * k, delay: (a.centerDelay + ring * a.pairStagger) * k, ease: a.ease });
  // Appears once it has begun swinging away from the centre axis.
  const emerge = (t: Tween): Tween => ({
    duration: a.duration * a.emergeDuration * k,
    delay: (t.delay ?? 0) + a.duration * a.emergeDelay * k,
    ease: [0.25, 0.1, 0.25, 1],
  });
  const jobs: Promise<unknown>[] = [];
  v.feathers.forEach((f, i) => {
    const t = open(Math.abs(i - CENTER_FEATHER));
    jobs.push(to(f.fold, 0, t), to(f.foldScale, 1, t), to(f.opacity, 1, emerge(t)));
    jobs.push(to(f.eye, 1, { duration: a.eyesDuration * k, delay: a.eyesDelay * k }));
  });
  peacockArt.backers.forEach((b, i) => {
    const t = open(Math.abs(b.angle + 90) / FEATHER_SPACING);
    const bv = v.backers[i];
    jobs.push(to(bv.fold, 0, t), to(bv.foldScale, 1, t), to(bv.opacity, 1, emerge(t)));
  });
  await Promise.all(jobs);
}

/** One gentle outward nudge across the section feathers — the only hint that they are interactive. */
export function hintFeathers(v: PeacockValues, indices: number[], ctx: Context) {
  if (ctx.reduced) return;
  const a = cfg.arrival;
  const g = fitPose(ctx.vp);
  indices.forEach((idx, n) => {
    const p = outward(peacockArt.feathers[idx], a.hintDistance, g);
    const opts = { duration: 0.9, delay: n * a.hintStagger, ease: "easeInOut" as const };
    animate(v.feathers[idx].x, [0, p.x, 0], opts);
    animate(v.feathers[idx].y, [0, p.y, 0], opts);
  });
}

// ---------------------------------------------------------------------------
// Hover / focus
// ---------------------------------------------------------------------------
export function hoverFeather(v: PeacockValues, idx: number, on: boolean, ctx: Context) {
  const h = cfg.hover;
  const p = on ? outward(peacockArt.feathers[idx], h.offset, fitPose(ctx.vp)) : IDENTITY;
  const t = { duration: ctx.reduced ? 0.01 : h.duration, ease: [0.22, 1, 0.36, 1] as const };
  const f = v.feathers[idx];
  void to(f.x, p.x, t);
  void to(f.y, p.y, t);
  void to(f.scale, on ? h.scale : 1, t);
}

// ---------------------------------------------------------------------------
// Detach: lift out of the fan → travel → turn upright beside the content.
// ---------------------------------------------------------------------------
function deemphasize(v: PeacockValues, except: number, value: number, t: Tween) {
  return Promise.all([
    to(v.body, value, t),
    to(v.backerOpacity, value, t),
    ...v.feathers.map((f, i) => (i === except ? Promise.resolve() : to(f.opacity, value, t))),
  ]);
}

export async function detachFeather(v: PeacockValues, idx: number, ctx: Context) {
  const d = cfg.detach;
  const art = peacockArt.feathers[idx];
  const f = v.feathers[idx];
  const group = sectionGroupPose(ctx.vp);
  const target = detachedPose(ctx.vp, art, group);

  if (ctx.reduced) {
    const q = { duration: cfg.reduced.fade };
    await to(f.opacity, 0, q);
    setGroup(v, group);
    setPose(f, target);
    v.body.set(cfg.deemphasis.section);
    v.backerOpacity.set(cfg.deemphasis.section);
    v.feathers.forEach((o, i) => i !== idx && o.opacity.set(cfg.deemphasis.section));
    await to(f.opacity, 1, q);
    return;
  }

  // A. Lift: straight out along its own axis, angle unchanged, clearing its neighbours.
  const lift = outward(art, d.liftDistance, fitPose(ctx.vp));
  const liftT = { duration: d.liftDuration, ease: [0.22, 1, 0.36, 1] as const };
  const fade = deemphasize(v, idx, cfg.deemphasis.section, { duration: d.liftDuration + d.travelDuration });
  await Promise.all([to(f.x, lift.x, liftT), to(f.y, lift.y, liftT), to(f.scale, 1.03, liftT)]);
  if (cancelled(ctx)) return;

  // B. Travel: float to the side; rotation starts only once it's clear.
  const travel = { duration: d.travelDuration, ease: d.ease };
  await Promise.all([
    groupTo(v, group, travel),
    to(f.x, target.x, travel),
    to(f.y, target.y, travel),
    to(f.scale, target.scale, travel),
    to(f.rotate, target.rotate, { duration: d.rotateDuration, delay: d.rotateDelay, ease: d.ease }),
    fade,
  ]);
}

// ---------------------------------------------------------------------------
// Return: content leaves → feather travels home, unturning → slides into its slot.
// `lower` puts the feather back into its original paint order.
// ---------------------------------------------------------------------------
export async function returnFeather(v: PeacockValues, idx: number, ctx: Context & { lower: () => void }) {
  const rc = cfg.return;
  const art = peacockArt.feathers[idx];
  const f = v.feathers[idx];
  const fit = fitPose(ctx.vp);

  await wait(rc.contentFade);
  if (cancelled(ctx)) return;

  if (ctx.reduced) {
    const q = { duration: cfg.reduced.fade };
    await to(f.opacity, 0, q);
    setGroup(v, fit);
    setPose(f, IDENTITY);
    ctx.lower();
    await deemphasize(v, -1, 1, q);
    return;
  }

  // Travel back to just outside its slot, restoring the ORIGINAL angle and scale.
  const approach = outward(art, cfg.detach.liftDistance, fit);
  const travel = { duration: rc.duration, ease: rc.ease };
  await Promise.all([
    groupTo(v, fit, travel),
    to(f.x, approach.x, travel),
    to(f.y, approach.y, travel),
    to(f.rotate, 0, travel),
    to(f.scale, 1, travel),
    deemphasize(v, idx, 1, travel),
  ]);
  if (cancelled(ctx)) return;

  // Slot in: back into its paint order, then along its axis into place.
  ctx.lower();
  const slot = { duration: rc.slotDuration, ease: [0.22, 1, 0.36, 1] as const };
  await Promise.all([to(f.x, 0, slot), to(f.y, 0, slot)]);
  // Exact original values — the fan must be indistinguishable from before.
  setPose(f, IDENTITY);
}

// ---------------------------------------------------------------------------
// About: the camera moves in on the chest; the tail recedes out of frame.
// ---------------------------------------------------------------------------
function tailOpacity(v: PeacockValues, value: number, t: Tween) {
  return Promise.all([to(v.backerOpacity, value, t), ...v.feathers.map((f) => to(f.opacity, value, t))]);
}

export async function zoomToChest(v: PeacockValues, ctx: Context) {
  const a = cfg.about;
  const g = aboutGroupPose(ctx.vp);
  if (ctx.reduced) {
    const q = { duration: cfg.reduced.zoom, ease: a.ease };
    await Promise.all([groupTo(v, g, q), tailOpacity(v, cfg.deemphasis.aboutTail, q)]);
    return;
  }
  await Promise.all([
    groupTo(v, g, { duration: a.duration, ease: a.ease }),
    tailOpacity(v, cfg.deemphasis.aboutTail, { duration: a.duration * 0.8, delay: a.duration * 0.15 }),
  ]);
}

export async function zoomOut(v: PeacockValues, ctx: Context) {
  const a = cfg.about;
  await wait(cfg.return.contentFade);
  if (cancelled(ctx)) return;
  const g = fitPose(ctx.vp);
  if (ctx.reduced) {
    const q = { duration: cfg.reduced.zoom, ease: a.ease };
    await Promise.all([groupTo(v, g, q), tailOpacity(v, 1, q)]);
    return;
  }
  await Promise.all([
    groupTo(v, g, { duration: a.duration, ease: a.ease }),
    tailOpacity(v, 1, { duration: a.duration * 0.8 }),
  ]);
}

/** Snap to a stable state's layout (after a resize). */
export function snapStable(v: PeacockValues, vp: Viewport, stable: { type: "idle" } | { type: "sectionOpen"; idx: number } | { type: "aboutOpen" }) {
  if (stable.type === "idle") setGroup(v, fitPose(vp));
  if (stable.type === "aboutOpen") setGroup(v, aboutGroupPose(vp));
  if (stable.type === "sectionOpen") {
    const g = sectionGroupPose(vp);
    setGroup(v, g);
    setPose(v.feathers[stable.idx], detachedPose(vp, peacockArt.feathers[stable.idx], g));
  }
}
