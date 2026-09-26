/**
 * Every analytics event and its properties, in one place.
 * Event names: lower snake_case. Properties: camelCase.
 * PostHog timestamps events itself, so timestamps are not duplicated here.
 *
 * Privacy: no event may carry guestbook text, names, visitor URLs, emails,
 * referrers, campaign parameters or full URLs. See docs/analytics-events.md.
 */
import type { FeatherId } from "@/data/featherConfig";

export type ViewportCategory = "desktop" | "tablet" | "mobile";
/** Everything that counts as "a section" in journeys. */
export type SectionKey = FeatherId | "about" | "quick_view";

export type FeatherOpenMethod = "click" | "keyboard" | "direct_route" | "index" | "browser_nav";
export type AboutOpenMethod = "chest_click" | "keyboard" | "index" | "direct_route" | "browser_nav";
export type QuickViewOpenMethod = "top_nav" | "index" | "direct_route" | "browser_nav";
export type CloseMethod = "close_button" | "escape" | "browser_back" | "another_section" | "navigation";
export type LinkLocation = "top_nav" | "index" | "about" | "contact" | "quick_view" | "footer";
export type GuestbookOpenMethod = "index" | "contact" | "guest_note";
export type GuestMessageCloseMethod = "button" | "escape" | "outside_click" | "leave_your_own" | "another_feather";

export interface EventMap {
  portfolio_visited: {
    sessionId: string;
    viewportCategory: ViewportCategory;
    reducedMotion: boolean;
    returningVisitor: boolean;
    visitNumber: number;
    route: string;
  };
  tail_unfurl_completed: {
    durationMs: number;
    reducedMotion: boolean;
    viewportCategory: ViewportCategory;
    /** Shortened because the visit started on a section route. */
    shortened: boolean;
  };
  portfolio_feather_hovered: { featherId: FeatherId; hoverDurationMs: number };
  portfolio_feather_opened: { featherId: FeatherId; sectionName: string; route: string; openMethod: FeatherOpenMethod };
  portfolio_feather_closed: { featherId: FeatherId; sectionName: string; dwellTimeMs: number; closeMethod: CloseMethod };
  about_opened: { openMethod: AboutOpenMethod; route: string };
  about_closed: { dwellTimeMs: number; closeMethod: CloseMethod };
  quick_view_opened: { openMethod: QuickViewOpenMethod };
  quick_view_closed: {
    dwellTimeMs: number;
    resumeClickedWhileOpen: boolean;
    externalLinkClickedWhileOpen: boolean;
    closeMethod: CloseMethod;
  };
  resume_clicked: { location: LinkLocation; action: "open" | "download"; route: string };
  linkedin_clicked: { location: LinkLocation; route: string };
  github_clicked: { location: LinkLocation; route: string };
  email_clicked: { location: LinkLocation; route: string };
  twitter_clicked: { location: LinkLocation; route: string };
  devpost_clicked: { location: LinkLocation; route: string };
  audio_enabled: { route: string; secondsIntoSession: number; trigger: "toggle" | "first_interaction" };
  audio_disabled: { route: string; enabledDurationSeconds: number };
  guestbook_opened: { openMethod: GuestbookOpenMethod; route: string };
  guestbook_submitted: {
    guestEntryId: string;
    messageLength: number;
    hasName: boolean;
    hasUrl: boolean;
    submissionSuccess: true;
  };
  guestbook_submission_failed: { errorCategory: "validation" | "storage" | "unknown"; messageLength: number };
  guest_feather_clicked: { guestEntryId: string; featherAgeDays: number; isSeedNote: boolean; route: string };
  guest_message_closed: { guestEntryId: string; dwellTimeMs: number; closeMethod: GuestMessageCloseMethod };
  session_heartbeat: { activeDurationSeconds: number; currentSection: SectionKey | "home"; route: string };
  session_completed: {
    activeDurationSeconds: number;
    totalElapsedSeconds: number;
    sectionsOpenedCount: number;
    uniqueSectionsOpenedCount: number;
    uniqueSectionsOpened: SectionKey[];
    sectionOpenOrder: SectionKey[];
    quickViewUsed: boolean;
    resumeClicked: boolean;
    aboutOpened: boolean;
    guestbookUsed: boolean;
    audioEnabledAtAnyPoint: boolean;
  };
}

export type AnalyticsEvent = keyof EventMap;

/** All event names — used by the dashboard to scope queries. */
export const ANALYTICS_EVENTS = [
  "portfolio_visited",
  "tail_unfurl_completed",
  "portfolio_feather_hovered",
  "portfolio_feather_opened",
  "portfolio_feather_closed",
  "about_opened",
  "about_closed",
  "quick_view_opened",
  "quick_view_closed",
  "resume_clicked",
  "linkedin_clicked",
  "github_clicked",
  "email_clicked",
  "twitter_clicked",
  "devpost_clicked",
  "audio_enabled",
  "audio_disabled",
  "guestbook_opened",
  "guestbook_submitted",
  "guestbook_submission_failed",
  "guest_feather_clicked",
  "guest_message_closed",
  "session_heartbeat",
  "session_completed",
] as const satisfies readonly AnalyticsEvent[];
