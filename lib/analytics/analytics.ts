/**
 * The analytics API used by components. Nothing in the UI imports PostHog.
 *
 * Every call is fire-and-forget and swallows its own errors: analytics never
 * awaits before navigation and can never break the peacock.
 */
import type { FeatherId } from "@/data/featherConfig";
import { featherById } from "@/data/featherConfig";
import { analyticsConfig as cfg } from "./config";
import { hasAnalyticsConsent, isDeviceExcluded, setDeviceExcluded } from "./consent";
import { startDwell, type DwellTimer } from "./dwell";
import type {
  AboutOpenMethod,
  AnalyticsEvent,
  CloseMethod,
  EventMap,
  FeatherOpenMethod,
  GuestbookOpenMethod,
  GuestMessageCloseMethod,
  LinkLocation,
  QuickViewOpenMethod,
  SectionKey,
  ViewportCategory,
} from "./events";
import { capture, load, registerSuper } from "./posthogClient";
import * as session from "./session";

// ---------------------------------------------------------------------------
// Core
// ---------------------------------------------------------------------------
export function track<E extends AnalyticsEvent>(event: E, properties: EventMap[E], options?: { beacon?: boolean }) {
  try {
    if (cfg.debug) console.info(`[analytics] ${event}`, properties);
    capture(event, properties as Record<string, unknown>, options?.beacon ? { transport: "sendBeacon" } : undefined);
  } catch {
    /* non-critical */
  }
}

/** Path only — never the query string or hash. */
export function currentRoute() {
  return typeof window === "undefined" ? "" : window.location.pathname;
}

export function viewportCategory(): ViewportCategory {
  const w = typeof window === "undefined" ? 1440 : window.innerWidth;
  return w < 700 ? "mobile" : w < 1024 ? "tablet" : "desktop";
}

const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** `?analytics=off` / `?analytics=on` marks this browser, then the parameter is removed from the URL. */
function applyExclusionParam() {
  try {
    const url = new URL(window.location.href);
    const v = url.searchParams.get("analytics");
    if (v !== "off" && v !== "on") return;
    setDeviceExcluded(v === "off");
    url.searchParams.delete("analytics");
    window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
  } catch {
    /* non-critical */
  }
}

// ---------------------------------------------------------------------------
// Session lifecycle (started once by <AnalyticsProvider>)
// ---------------------------------------------------------------------------
let started = false;

export function startAnalytics() {
  if (started || typeof window === "undefined") return;
  started = true;
  applyExclusionParam();
  // The owner's own browsers send nothing — PostHog isn't even loaded.
  if (isDeviceExcluded()) return;
  try {
    const s = session.getSession();
    registerSuper({ sessionId: s.id });
    void load(hasAnalyticsConsent());

    const visit = session.countVisit();
    if (visit.first) {
      track("portfolio_visited", {
        sessionId: s.id,
        viewportCategory: viewportCategory(),
        reducedMotion: reducedMotion(),
        returningVisitor: visit.returningVisitor,
        visitNumber: visit.visitNumber,
        route: currentRoute(),
      });
    }

    // Active-time bookkeeping.
    const onInput = () => session.markActive();
    for (const e of ["pointerdown", "keydown", "touchstart", "wheel", "scroll"] as const) {
      window.addEventListener(e, onInput, { passive: true, capture: true });
    }
    let lastMove = 0;
    window.addEventListener(
      "pointermove",
      () => {
        const now = Date.now();
        if (now - lastMove > 2000) {
          lastMove = now;
          session.markActive();
        }
      },
      { passive: true },
    );

    // Never repeat a heartbeat that carries no new active time (e.g. rapid tab switching).
    let lastSent = -1;
    const heartbeat = (beacon = false) => {
      const activeDurationSeconds = session.activeSeconds();
      if (activeDurationSeconds === lastSent) return;
      lastSent = activeDurationSeconds;
      track(
        "session_heartbeat",
        { activeDurationSeconds, currentSection: session.getCurrentSection(), route: currentRoute() },
        { beacon },
      );
    };

    window.setInterval(() => {
      session.tick();
      if (session.heartbeatDue()) heartbeat();
    }, cfg.tickMs);

    // Backgrounding (mobile often never fires pagehide): record progress now.
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        session.tick();
        heartbeat(true);
      } else {
        session.resumeFromHidden();
      }
    });

    // Leaving: one summary per page lifetime, delivered with sendBeacon.
    let completed = false;
    window.addEventListener("pagehide", () => {
      if (completed) return;
      completed = true;
      session.tick();
      track("session_completed", session.summary(), { beacon: true });
    });
  } catch {
    /* analytics is non-critical */
  }
}

// ---------------------------------------------------------------------------
// Peacock
// ---------------------------------------------------------------------------
export function trackTailUnfurled(durationMs: number, shortened: boolean) {
  track("tail_unfurl_completed", {
    durationMs: Math.round(durationMs),
    reducedMotion: reducedMotion(),
    viewportCategory: viewportCategory(),
    shortened,
  });
}

const hovered = new Set<FeatherId>();
/** Only meaningful hovers, once per feather per page. */
export function trackFeatherHover(featherId: FeatherId, hoverDurationMs: number) {
  if (hoverDurationMs < cfg.hoverIntentMs || hovered.has(featherId)) return;
  hovered.add(featherId);
  track("portfolio_feather_hovered", { featherId, hoverDurationMs: Math.round(hoverDurationMs) });
}

let sectionDwell: DwellTimer | null = null;

export function trackFeatherOpened(featherId: FeatherId, openMethod: FeatherOpenMethod) {
  session.recordSection(featherId);
  track("portfolio_feather_opened", {
    featherId,
    sectionName: featherById[featherId].label,
    route: currentRoute(),
    openMethod,
  });
}

/** Call when the section's content is actually on screen. */
export function startSectionDwell(section: SectionKey) {
  sectionDwell?.stop();
  sectionDwell = startDwell();
  session.setCurrentSection(section);
}

function stopSectionDwell() {
  const ms = sectionDwell?.stop() ?? 0;
  sectionDwell = null;
  session.setCurrentSection("home");
  return ms;
}

export function trackFeatherClosed(featherId: FeatherId, closeMethod: CloseMethod) {
  track("portfolio_feather_closed", {
    featherId,
    sectionName: featherById[featherId].label,
    dwellTimeMs: stopSectionDwell(),
    closeMethod,
  });
}

export function trackAboutOpened(openMethod: AboutOpenMethod) {
  session.recordSection("about");
  track("about_opened", { openMethod, route: currentRoute() });
}

export function trackAboutClosed(closeMethod: CloseMethod) {
  track("about_closed", { dwellTimeMs: stopSectionDwell(), closeMethod });
}

// ---------------------------------------------------------------------------
// Quick View
// ---------------------------------------------------------------------------
let quickView: { dwell: DwellTimer; clicks: { resume: number; external: number } } | null = null;

export function trackQuickViewOpened(openMethod: QuickViewOpenMethod) {
  if (quickView) return;
  session.recordSection("quick_view");
  session.setCurrentSection("quick_view");
  quickView = { dwell: startDwell(), clicks: session.linkClickCounts() };
  track("quick_view_opened", { openMethod });
}

export function trackQuickViewClosed(closeMethod: CloseMethod) {
  if (!quickView) return;
  const now = session.linkClickCounts();
  track("quick_view_closed", {
    dwellTimeMs: quickView.dwell.stop(),
    resumeClickedWhileOpen: now.resume > quickView.clicks.resume,
    externalLinkClickedWhileOpen: now.external > quickView.clicks.external,
    closeMethod,
  });
  quickView = null;
  session.setCurrentSection("home");
}

// ---------------------------------------------------------------------------
// Links (resume + profiles). Destination URLs are never sent.
// ---------------------------------------------------------------------------
export type LinkKind = "resume" | "linkedin" | "github" | "email" | "twitter" | "devpost";

export function linkKindFromLabel(label: string): LinkKind | null {
  const l = label.toLowerCase();
  if (l.startsWith("resume")) return "resume";
  if (l.startsWith("linkedin")) return "linkedin";
  if (l.startsWith("github")) return "github";
  if (l.startsWith("email")) return "email";
  if (l.startsWith("x ") || l.startsWith("x/") || l.includes("twitter")) return "twitter";
  if (l.startsWith("devpost")) return "devpost";
  return null;
}

export function trackLinkClicked(kind: LinkKind, location: LinkLocation) {
  const route = currentRoute();
  if (kind === "resume") {
    session.recordLinkClick("resume");
    track("resume_clicked", { location, action: "open", route });
    return;
  }
  session.recordLinkClick("external");
  track(`${kind}_clicked`, { location, route });
}

// ---------------------------------------------------------------------------
// Audio
// ---------------------------------------------------------------------------
let audioOnAt: number | null = null;

export function trackAudioEnabled(trigger: "toggle" | "first_interaction") {
  audioOnAt = Date.now();
  session.setFlag("audioEnabledAtAnyPoint");
  track("audio_enabled", { route: currentRoute(), secondsIntoSession: session.elapsedSeconds(), trigger });
}

export function trackAudioDisabled() {
  const enabledDurationSeconds = audioOnAt ? Math.round((Date.now() - audioOnAt) / 1000) : 0;
  audioOnAt = null;
  track("audio_disabled", { route: currentRoute(), enabledDurationSeconds });
}

// ---------------------------------------------------------------------------
// Guestbook — metadata only, never the note, name or link.
// ---------------------------------------------------------------------------
export function trackGuestbookOpened(openMethod: GuestbookOpenMethod) {
  session.setFlag("guestbookUsed");
  track("guestbook_opened", { openMethod, route: currentRoute() });
}

export function trackGuestbookSubmitted(entry: { id: string; message: string; name?: string; url?: string }) {
  // Only lengths and yes/no flags are sent — never the note, name or link.
  session.setFlag("guestbookUsed");
  track("guestbook_submitted", {
    guestEntryId: entry.id,
    messageLength: entry.message.length,
    hasName: !!entry.name,
    hasUrl: !!entry.url,
    submissionSuccess: true,
  });
}

export function trackGuestbookFailed(error: unknown, messageLength: number) {
  const category = (error as { category?: string } | null)?.category;
  const errorCategory = category === "validation" ? "validation" : category ? "storage" : "unknown";
  track("guestbook_submission_failed", { errorCategory, messageLength });
}

let guestNote: { id: string; dwell: DwellTimer } | null = null;

export function trackGuestFeatherClicked(entry: { id: string; createdAt: string }) {
  session.setFlag("guestbookUsed");
  const ageMs = Date.now() - Date.parse(entry.createdAt);
  guestNote?.dwell.stop();
  guestNote = { id: entry.id, dwell: startDwell() };
  track("guest_feather_clicked", {
    guestEntryId: entry.id,
    featherAgeDays: Number.isFinite(ageMs) ? Math.max(0, Math.floor(ageMs / 86_400_000)) : 0,
    isSeedNote: entry.id.startsWith("seed-"),
    route: currentRoute(),
  });
}

export function trackGuestMessageClosed(closeMethod: GuestMessageCloseMethod) {
  if (!guestNote) return;
  track("guest_message_closed", { guestEntryId: guestNote.id, dwellTimeMs: guestNote.dwell.stop(), closeMethod });
  guestNote = null;
}
