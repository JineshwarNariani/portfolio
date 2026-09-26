/**
 * Ambient flute — a small client-only store, independent of the peacock state.
 * Living outside React means the track never restarts on navigation.
 *
 * - On by default, but browsers forbid sound before a user gesture — so it
 *   fades in on the visitor's first click/tap/keypress anywhere on the page.
 *   (If that first gesture is on the Flute control itself, it simply turns off.)
 * - Fades through a Web Audio GainNode (works on iOS, where media volume is read-only).
 * - Turning it off persists for the session.
 */

import { trackAudioDisabled, trackAudioEnabled } from "@/lib/analytics/analytics";

export const fluteConfig = {
  src: "/audio/flute-ambient.mp3",
  /** Output level, 0–1. Keep it low. */
  volume: 0.18,
  fadeInMs: 3000,
  fadeOutMs: 1600,
  storageKey: "pk-flute",
  /** Default when the visitor hasn't chosen this session. */
  defaultOn: true,
} as const;

type Listener = () => void;

let enabled = false;
let initialized = false;
const listeners = new Set<Listener>();

let ctx: AudioContext | null = null;
let gain: GainNode | null = null;
let audio: HTMLAudioElement | null = null;
let pauseTimer: number | null = null;

const emit = () => listeners.forEach((l) => l());

function persist() {
  try {
    sessionStorage.setItem(fluteConfig.storageKey, enabled ? "on" : "off");
  } catch {
    /* private mode: preference just won't persist */
  }
}

function init() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  let stored: string | null = null;
  try {
    stored = sessionStorage.getItem(fluteConfig.storageKey);
  } catch {
    /* storage blocked: fall back to the default */
  }
  enabled = stored ? stored === "on" : fluteConfig.defaultOn;
  if (!enabled) return;

  const events = ["pointerup", "keydown", "touchend"] as const;
  const resume = (e: Event) => {
    events.forEach((t) => window.removeEventListener(t, resume, true));
    // A first click on the Flute control means "off" — let the toggle handle it.
    if ((e.target as Element | null)?.closest?.(".flute-control")) return;
    if (!enabled) return;
    void start();
    trackAudioEnabled("first_interaction");
  };
  events.forEach((t) => window.addEventListener(t, resume, true));
}

function ramp(target: number, ms: number) {
  if (!ctx || !gain) return;
  const now = ctx.currentTime;
  gain.gain.cancelScheduledValues(now);
  gain.gain.setValueAtTime(gain.gain.value, now);
  gain.gain.linearRampToValueAtTime(target, now + ms / 1000);
}

async function start() {
  if (!ctx) {
    const Ctor =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    ctx = new Ctor();
    gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(ctx.destination);
  }
  if (pauseTimer) {
    clearTimeout(pauseTimer);
    pauseTimer = null;
  }
  void ctx.resume();
  if (!audio) {
    audio = new Audio();
    audio.loop = true;
    audio.preload = "auto";
    ctx.createMediaElementSource(audio).connect(gain!);
    audio.src = fluteConfig.src;
  }
  if (!enabled) return;
  await audio.play().catch(() => undefined);
  ramp(fluteConfig.volume, fluteConfig.fadeInMs);
}

function stop() {
  if (!ctx) return;
  ramp(0, fluteConfig.fadeOutMs);
  pauseTimer = window.setTimeout(() => {
    if (enabled) return;
    audio?.pause();
    void ctx?.suspend();
  }, fluteConfig.fadeOutMs + 60);
}

export const fluteAudio = {
  subscribe(l: Listener) {
    init();
    listeners.add(l);
    return () => listeners.delete(l);
  },
  getSnapshot() {
    init();
    return enabled;
  },
  getServerSnapshot() {
    return false;
  },
  toggle() {
    enabled = !enabled;
    persist();
    if (enabled) {
      void start();
      trackAudioEnabled("toggle");
    } else {
      stop();
      trackAudioDisabled();
    }
    emit();
  },
};
