/**
 * Anonymous session state.
 *
 * - sessionId: random UUID in sessionStorage — resets with each new browser
 *   session, never used as a lasting identity.
 * - returning visitor: a localStorage visit counter (no identity, no fingerprinting).
 * - active time: counted only while the page is VISIBLE and the visitor has
 *   interacted within the inactivity window (pointer, key, touch, wheel, scroll).
 *   Returning to the tab counts as activity.
 * - journey + flags: persisted in sessionStorage so a reload continues the session.
 */
import { analyticsConfig as cfg } from "./config";
import type { SectionKey } from "./events";

const SESSION_KEY = "pk-an-session";
const VISITS_KEY = "pk-an-visits";

interface SessionState {
  id: string;
  startedAt: number;
  activeMs: number;
  lastHeartbeatActiveMs: number;
  visitCounted: boolean;
  visitNumber: number;
  journey: SectionKey[];
  flags: {
    quickViewUsed: boolean;
    resumeClicked: boolean;
    aboutOpened: boolean;
    guestbookUsed: boolean;
    audioEnabledAtAnyPoint: boolean;
  };
  /** Link clicks so far — lets Quick View report clicks made while it was open. */
  resumeClicks: number;
  externalClicks: number;
}

let state: SessionState | null = null;
let currentSection: SectionKey | "home" = "home";
let lastInput = Date.now();
let lastTick = Date.now();

function uuid() {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
  }
}

function save() {
  try {
    if (state) sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
  } catch {
    /* storage blocked: session lives in memory for this page */
  }
}

export function getSession(): SessionState {
  if (state) return state;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) state = JSON.parse(raw) as SessionState;
  } catch {
    state = null;
  }
  state ??= {
    id: uuid(),
    startedAt: Date.now(),
    activeMs: 0,
    lastHeartbeatActiveMs: 0,
    visitCounted: false,
    visitNumber: 1,
    journey: [],
    flags: { quickViewUsed: false, resumeClicked: false, aboutOpened: false, guestbookUsed: false, audioEnabledAtAnyPoint: false },
    resumeClicks: 0,
    externalClicks: 0,
  };
  save();
  return state;
}

/** First call per browser session increments the visit counter. */
export function countVisit(): { first: boolean; returningVisitor: boolean; visitNumber: number } {
  const s = getSession();
  if (s.visitCounted) return { first: false, returningVisitor: s.visitNumber > 1, visitNumber: s.visitNumber };
  let n = 1;
  try {
    n = Number(localStorage.getItem(VISITS_KEY) ?? "0") + 1;
    localStorage.setItem(VISITS_KEY, String(n));
  } catch {
    /* storage blocked: treat as a first visit */
  }
  s.visitCounted = true;
  s.visitNumber = n;
  save();
  return { first: true, returningVisitor: n > 1, visitNumber: n };
}

export function recordSection(key: SectionKey) {
  const s = getSession();
  if (s.journey.length < cfg.maxJourney) s.journey.push(key);
  if (key === "about") s.flags.aboutOpened = true;
  if (key === "quick_view") s.flags.quickViewUsed = true;
  save();
}

export function setFlag(flag: keyof SessionState["flags"]) {
  const s = getSession();
  s.flags[flag] = true;
  save();
}

export function recordLinkClick(kind: "resume" | "external") {
  const s = getSession();
  if (kind === "resume") {
    s.resumeClicks++;
    s.flags.resumeClicked = true;
  } else s.externalClicks++;
  save();
}

export function linkClickCounts() {
  const s = getSession();
  return { resume: s.resumeClicks, external: s.externalClicks };
}

export function setCurrentSection(section: SectionKey | "home") {
  currentSection = section;
}
export const getCurrentSection = () => currentSection;

// ---------------------------------------------------------------------------
// Active time
// ---------------------------------------------------------------------------
/** Credit active time up to now (never past the inactivity window). */
export function tick() {
  const s = getSession();
  const now = Date.now();
  if (document.visibilityState === "visible") {
    const until = Math.min(now, lastInput + cfg.inactivityTimeoutMs);
    if (until > lastTick) s.activeMs += until - lastTick;
  }
  lastTick = now;
  save();
}

export function markActive() {
  const now = Date.now();
  // Coming back from idle: don't credit the idle gap.
  if (now - lastInput > cfg.inactivityTimeoutMs) {
    tick();
    lastTick = now;
  }
  lastInput = now;
}

/** Tab became visible again: resume from now. */
export function resumeFromHidden() {
  lastInput = Date.now();
  lastTick = Date.now();
}

export function activeSeconds() {
  return Math.round(getSession().activeMs / 1000);
}

export function elapsedSeconds() {
  return Math.round((Date.now() - getSession().startedAt) / 1000);
}

/** True when a new minute of active time has accrued since the last heartbeat. */
export function heartbeatDue(): boolean {
  const s = getSession();
  if (s.activeMs - s.lastHeartbeatActiveMs < cfg.heartbeatActiveMs) return false;
  s.lastHeartbeatActiveMs = s.activeMs;
  save();
  return true;
}

export function summary() {
  const s = getSession();
  const unique = [...new Set(s.journey)];
  return {
    activeDurationSeconds: activeSeconds(),
    totalElapsedSeconds: elapsedSeconds(),
    sectionsOpenedCount: s.journey.length,
    uniqueSectionsOpenedCount: unique.length,
    uniqueSectionsOpened: unique,
    sectionOpenOrder: [...s.journey],
    ...s.flags,
  };
}
