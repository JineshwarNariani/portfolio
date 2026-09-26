/**
 * A light breeze for the guestbook feathers. Pure functions + a small mutable
 * particle per feather; the field advances them once per animation frame and
 * writes transforms directly (no React renders).
 *
 * The wind is a slowly wandering heading (mostly left→right) whose strength
 * swells in occasional gusts. Each feather lags behind the wind (it has
 * "inertia"), adds a little turbulence of its own, bobs, and leans with its
 * vertical motion plus a slow sway — it never spins.
 */
import { animationConfig } from "@/lib/animationConfig";

const cfg = animationConfig.guestbook;

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  scale: number;
  opacity: number;
  /** 0 = frozen (note open), ~0.08 = hovered, 1 = free. */
  speed: number;
  seed: number;
  bobPhase: number;
  swayPhase: number;
  retired: boolean;
}

export interface Bounds {
  w: number;
  h: number;
}

/** Deterministic 0..1 from a string (so each note keeps its own character). */
export function seedOf(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return ((h >>> 0) % 10000) / 10000;
}

export function windAt(t: number): { x: number; y: number } {
  const heading = cfg.windWander * (0.65 * Math.sin(t / 23) + 0.35 * Math.sin(t / 9.7 + 1.3));
  const gust = Math.pow(Math.max(0, Math.sin(t / 17 + 0.6)), 6) * cfg.gustSpeed;
  const strength = cfg.windSpeed * (0.75 + 0.25 * Math.sin(t / 11)) + gust;
  return { x: Math.cos(heading) * strength, y: Math.sin(heading) * strength * 0.6 };
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);

export function safeY(b: Bounds) {
  return rand(cfg.safeTop + 20, Math.max(cfg.safeTop + 40, b.h - cfg.safeBottom - 40));
}

export function spawn(
  id: string,
  origin: "initial" | "edge" | "point",
  b: Bounds,
  point?: { x: number; y: number },
): Particle {
  const seed = seedOf(id);
  const base = {
    vx: 0,
    vy: 0,
    rot: rand(-12, 12),
    scale: 1,
    opacity: 0,
    speed: 1,
    seed,
    bobPhase: seed * Math.PI * 2,
    swayPhase: seed * 11,
    retired: false,
  };
  if (origin === "point" && point) return { ...base, x: point.x, y: point.y, vx: rand(-8, 8), vy: -38 };
  if (origin === "edge") return { ...base, x: -60, y: safeY(b), vx: cfg.windSpeed * 0.6 };
  return { ...base, x: rand(b.w * 0.05, b.w * 0.95), y: safeY(b) };
}

/**
 * Advance one particle by dt seconds.
 * `targetSpeed` eases the feather to a stop (open note) or a crawl (hover).
 */
export function step(p: Particle, dt: number, t: number, wind: { x: number; y: number }, b: Bounds, targetSpeed: number) {
  p.speed += (targetSpeed - p.speed) * Math.min(1, dt * 4);
  const k = Math.min(1, dt / cfg.response);

  // Wind + a little personal turbulence.
  const dx = wind.x + Math.sin(t * 0.37 + p.seed * 17) * cfg.turbulence;
  let dy = wind.y + Math.sin(t * 0.29 + p.seed * 23) * cfg.turbulence;
  // Soft walls: drift back into the safe band instead of bouncing.
  const top = cfg.safeTop;
  const bottom = b.h - cfg.safeBottom;
  if (p.y < top) dy += (top - p.y) * 0.9;
  if (p.y > bottom) dy -= (p.y - bottom) * 0.9;

  p.vx += (dx - p.vx) * k;
  p.vy += (dy - p.vy) * k;
  p.x += p.vx * dt * p.speed;
  p.y += p.vy * dt * p.speed;

  // Carried off one side → re-enter, unhurried, from the other.
  if (p.x > b.w + 70) {
    p.x = -70;
    p.y = safeY(b);
  } else if (p.x < -70) {
    p.x = b.w + 70;
    p.y = safeY(b);
  }

  p.bobPhase += (dt * p.speed * Math.PI * 2) / cfg.bobPeriod;
  p.swayPhase += dt * p.speed * 0.8;
  const lean = Math.max(-22, Math.min(22, p.vy * 0.7 + p.vx * 0.25));
  const targetRot = lean + Math.sin(p.swayPhase) * cfg.swayDegrees;
  p.rot += (targetRot - p.rot) * Math.min(1, dt * 1.2 * p.speed);
}

/** Rendered transform (bob is applied here so it freezes with the feather). */
export function transformOf(p: Particle) {
  const bob = Math.sin(p.bobPhase) * cfg.bobAmplitude;
  return `translate3d(${p.x.toFixed(1)}px, ${(p.y + bob).toFixed(1)}px, 0) rotate(${p.rot.toFixed(2)}deg) scale(${p.scale.toFixed(3)})`;
}

/** Calm fixed positions for reduced motion: resting along both margins. */
export function restingPosition(index: number, count: number, b: Bounds): { x: number; y: number; rot: number } {
  const left = index % 2 === 0;
  const row = Math.floor(index / 2);
  const rows = Math.ceil(count / 2);
  const span = b.h - cfg.safeTop - cfg.safeBottom;
  return {
    x: left ? b.w * 0.07 : b.w * 0.93,
    y: cfg.safeTop + span * ((row + 1) / (rows + 1)),
    rot: left ? -14 : 14,
  };
}
