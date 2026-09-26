import "server-only";

import { featherById, isFeatherId } from "@/data/featherConfig";
import { ANALYTICS_EVENTS } from "./events";
import { hogql } from "./posthogServer";

/**
 * Everything the private dashboard shows. Queries select ONLY whitelisted
 * behavioural properties plus approximate GeoIP location (city/country) —
 * never IPs, referrers, user agents or any guestbook content.
 */
export type Range = "24h" | "7d" | "30d" | "all";
export const RANGES: { id: Range; label: string }[] = [
  { id: "24h", label: "Last 24 hours" },
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
  { id: "all", label: "All time" },
];
export const parseRange = (v: unknown): Range => (RANGES.some((r) => r.id === v) ? (v as Range) : "7d");

const RANGE_SQL: Record<Range, string> = {
  "24h": "timestamp >= now() - INTERVAL 1 DAY",
  "7d": "timestamp >= now() - INTERVAL 7 DAY",
  "30d": "timestamp >= now() - INTERVAL 30 DAY",
  all: "1 = 1",
};
const list = (xs: readonly string[]) => xs.map((x) => `'${x}'`).join(", ");
const OURS = list(ANALYTICS_EVENTS);
const num = (v: unknown) => (typeof v === "number" ? v : Number(v ?? 0) || 0);
const str = (v: unknown) => (typeof v === "string" && v !== "" ? v : null);

/** Session ids are random UUIDs — anything else is rejected before it reaches a query. */
export const isSessionId = (v: string) => /^[0-9a-f-]{8,64}$/i.test(v);

export function sectionLabel(key: string | null): string {
  if (!key) return "";
  if (key === "about") return "About";
  if (key === "quick_view") return "Quick View";
  return isFeatherId(key) ? featherById[key].label : key;
}

// ---------------------------------------------------------------------------
export async function getSummary(range: Range) {
  const [[row = []], [dur = []]] = await Promise.all([
    hogql(
      `SELECT
        countIf(event = 'portfolio_visited'),
        uniqIf(distinct_id, event = 'portfolio_visited'),
        uniq(properties.sessionId),
        countIf(event = 'portfolio_visited' AND toString(properties.returningVisitor) = 'true'),
        countIf(event = 'resume_clicked'),
        countIf(event = 'quick_view_opened'),
        countIf(event = 'about_opened'),
        countIf(event = 'guestbook_submitted'),
        countIf(event = 'guest_feather_clicked'),
        uniqIf(properties.sessionId, event = 'audio_enabled')
      FROM events WHERE ${RANGE_SQL[range]} AND event IN (${OURS})`,
      "summary",
    ),
    hogql(
      `SELECT avg(d), quantile(0.5)(d), count() FROM (
        SELECT properties.sessionId AS sid, max(toFloat(properties.activeDurationSeconds)) AS d
        FROM events
        WHERE ${RANGE_SQL[range]} AND event IN ('session_heartbeat', 'session_completed') AND properties.sessionId IS NOT NULL
        GROUP BY sid
      )`,
      "durations",
    ),
  ]);
  const [visits, visitors, sessions, returning, resume, quickView, about, guestbook, guestFeathers, audioSessions] =
    row.map(num);
  return {
    visits,
    visitors,
    sessions,
    returningPct: visits ? (returning / visits) * 100 : 0,
    resume,
    quickView,
    about,
    guestbook,
    guestFeathers,
    audioRatePct: sessions ? (audioSessions / sessions) * 100 : 0,
    avgActiveSeconds: num(dur[0]),
    medianActiveSeconds: num(dur[1]),
    sessionsWithDuration: num(dur[2]),
  };
}

// ---------------------------------------------------------------------------
const OPENS = ["portfolio_feather_opened", "about_opened", "quick_view_opened"];
const CLOSES = ["portfolio_feather_closed", "about_closed", "quick_view_closed"];

export async function getSectionStats(range: Range) {
  const rows = await hogql(
    `SELECT
       multiIf(event IN ('portfolio_feather_opened', 'portfolio_feather_closed'), toString(properties.featherId),
               event IN ('about_opened', 'about_closed'), 'about', 'quick_view') AS section,
       countIf(event IN (${list(OPENS)})) AS opens,
       uniqIf(properties.sessionId, event IN (${list(OPENS)})) AS sessions,
       avgIf(toFloat(properties.dwellTimeMs), event IN (${list(CLOSES)})) AS dwell
     FROM events WHERE ${RANGE_SQL[range]} AND event IN (${list([...OPENS, ...CLOSES])})
     GROUP BY section ORDER BY opens DESC`,
    "sections",
  );
  return rows
    .map(([section, opens, sessions, dwell]) => ({
      section: String(section ?? ""),
      label: sectionLabel(str(section)),
      opens: num(opens),
      sessions: num(sessions),
      avgDwellMs: num(dwell),
    }))
    .filter((r) => r.label);
}

// ---------------------------------------------------------------------------
/** Approximate visitor location from PostHog GeoIP (country + city). */
export async function getLocations(range: Range, limit = 25) {
  const rows = await hogql(
    `SELECT toString(properties.$geoip_country_name) AS country, toString(properties.$geoip_city_name) AS city,
            count() AS visits, uniq(distinct_id) AS visitors
     FROM events WHERE ${RANGE_SQL[range]} AND event = 'portfolio_visited'
     GROUP BY country, city ORDER BY visits DESC LIMIT ${limit}`,
    "locations",
  );
  return rows.map(([country, city, visits, visitors]) => ({
    country: str(country) ?? "Unknown",
    city: str(city) ?? "—",
    visits: num(visits),
    visitors: num(visitors),
  }));
}

// ---------------------------------------------------------------------------
/** Dashboard timezone (validated before it is placed in a query). */
const TZ = /^[A-Za-z_]+(\/[A-Za-z_+-]+)*$/.test(process.env.ANALYTICS_TIMEZONE ?? "")
  ? process.env.ANALYTICS_TIMEZONE!
  : "America/New_York";

export async function getSeries(range: Range) {
  // Bucket in the dashboard's timezone so a late-evening visit lands on the right day.
  const local = `toTimeZone(timestamp, '${TZ}')`;
  const bucket = range === "24h" ? `toStartOfHour(${local})` : `toStartOfDay(${local})`;
  const rows = await hogql(
    `SELECT ${bucket} AS b, countIf(event = 'portfolio_visited'), countIf(event = 'resume_clicked')
     FROM events WHERE ${RANGE_SQL[range]} AND event IN ('portfolio_visited', 'resume_clicked')
     GROUP BY b ORDER BY b`,
    "series",
  );
  return rows.map(([b, visits, resume]) => ({ at: String(b), visits: num(visits), resume: num(resume) }));
}

// ---------------------------------------------------------------------------
export interface SessionRow {
  id: string;
  startedAt: string;
  /** Approximate, from GeoIP ("City, Country"). */
  location: string;
  activeSeconds: number;
  journey: string[];
  resume: boolean;
  quickView: boolean;
  guestbook: boolean;
  audio: boolean;
}

/** Recent anonymous sessions, assembled from a bounded set of events. */
export async function getRecentSessions(range: Range, limit = 40): Promise<SessionRow[]> {
  const rows = await hogql(
    `SELECT toString(properties.sessionId), timestamp, event, toString(properties.featherId),
            toFloat(properties.activeDurationSeconds), toString(properties.$geoip_city_name), toString(properties.$geoip_country_name)
     FROM events
     WHERE ${RANGE_SQL[range]} AND event IN (${OURS}) AND properties.sessionId IS NOT NULL
     ORDER BY timestamp DESC LIMIT 5000`,
    "sessions",
  );
  const byId = new Map<string, SessionRow & { events: { at: string; section: string | null }[] }>();
  for (const [sid, at, event, feather, active, city, country] of rows) {
    const id = str(sid);
    if (!id) continue;
    let s = byId.get(id);
    if (!s) {
      s = { id, startedAt: String(at), location: "", activeSeconds: 0, journey: [], resume: false, quickView: false, guestbook: false, audio: false, events: [] };
      byId.set(id, s);
    }
    if (!s.location && (str(city) || str(country))) s.location = [str(city), str(country)].filter(Boolean).join(", ");
    s.startedAt = String(at) < s.startedAt ? String(at) : s.startedAt;
    s.activeSeconds = Math.max(s.activeSeconds, num(active));
    const section =
      event === "portfolio_feather_opened" ? str(feather) : event === "about_opened" ? "about" : event === "quick_view_opened" ? "quick_view" : null;
    s.events.push({ at: String(at), section });
    if (event === "resume_clicked") s.resume = true;
    if (event === "quick_view_opened") s.quickView = true;
    if (event === "guestbook_opened" || event === "guestbook_submitted" || event === "guest_feather_clicked") s.guestbook = true;
    if (event === "audio_enabled") s.audio = true;
  }
  return [...byId.values()]
    .sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1))
    .slice(0, limit)
    .map(({ events, ...s }) => ({
      ...s,
      journey: events
        .filter((e) => e.section)
        .sort((a, b) => (a.at < b.at ? -1 : 1))
        .map((e) => sectionLabel(e.section)),
    }));
}

// ---------------------------------------------------------------------------
export interface TimelineRow {
  at: string;
  event: string;
  section: string;
  detail: string;
}

export async function getSessionTimeline(sessionId: string): Promise<TimelineRow[]> {
  if (!isSessionId(sessionId)) return [];
  const rows = await hogql(
    `SELECT timestamp, event, toString(properties.featherId), toString(properties.openMethod),
            toString(properties.closeMethod), toFloat(properties.dwellTimeMs), toString(properties.location),
            toFloat(properties.activeDurationSeconds), toFloat(properties.messageLength), toString(properties.trigger),
            toString(properties.viewportCategory), toString(properties.returningVisitor), toString(properties.currentSection),
            toString(properties.$geoip_city_name), toString(properties.$geoip_country_name)
     FROM events
     WHERE properties.sessionId = '${sessionId}' AND event IN (${OURS})
     ORDER BY timestamp ASC LIMIT 500`,
    "timeline",
  );
  return rows.map(([at, event, feather, open, close, dwell, location, active, msgLen, trigger, viewport, returning, current, city, country]) => {
    const e = String(event);
    const section =
      sectionLabel(str(feather)) ||
      (e.startsWith("about_") ? "About" : e.startsWith("quick_view_") ? "Quick View" : sectionLabel(str(current)));
    const parts = [
      str(open) && `via ${String(open).replace(/_/g, " ")}`,
      str(close) && `closed by ${String(close).replace(/_/g, " ")}`,
      num(dwell) > 0 && `${Math.round(num(dwell) / 1000)}s viewed`,
      str(location) && `from ${String(location).replace(/_/g, " ")}`,
      num(active) > 0 && `${formatDuration(num(active))} active`,
      num(msgLen) > 0 && `${num(msgLen)} chars`,
      str(trigger) && String(trigger).replace(/_/g, " "),
      str(viewport),
      str(returning) === "true" && "returning visitor",
      e === "portfolio_visited" && [str(city), str(country)].filter(Boolean).join(", "),
    ].filter(Boolean);
    return { at: String(at), event: e, section, detail: parts.join(" · ") };
  });
}

// ---------------------------------------------------------------------------
const ACTIVITY_EVENTS = [
  "portfolio_visited",
  "portfolio_feather_opened",
  "about_opened",
  "quick_view_opened",
  "resume_clicked",
  "linkedin_clicked",
  "github_clicked",
  "email_clicked",
  "twitter_clicked",
  "devpost_clicked",
  "audio_enabled",
  "guestbook_opened",
  "guestbook_submitted",
  "guest_feather_clicked",
];

export function describeEvent(event: string, feather: string | null) {
  switch (event) {
    case "portfolio_visited":
      return "New visit";
    case "portfolio_feather_opened":
      return `${sectionLabel(feather)} opened`;
    case "about_opened":
      return "About opened";
    case "quick_view_opened":
      return "Quick View opened";
    case "resume_clicked":
      return "Resume clicked";
    case "linkedin_clicked":
      return "LinkedIn clicked";
    case "github_clicked":
      return "GitHub clicked";
    case "email_clicked":
      return "Email clicked";
    case "twitter_clicked":
      return "X / Twitter clicked";
    case "devpost_clicked":
      return "Devpost clicked";
    case "audio_enabled":
      return "Flute turned on";
    case "guestbook_opened":
      return "Leave-a-feather opened";
    case "guestbook_submitted":
      return "A feather was left";
    case "guest_feather_clicked":
      return "Guest feather caught";
    default:
      return event.replace(/_/g, " ");
  }
}

export async function getRecentActivity(limit = 25) {
  const rows = await hogql(
    `SELECT timestamp, event, toString(properties.featherId)
     FROM events WHERE event IN (${list(ACTIVITY_EVENTS)}) AND timestamp >= now() - INTERVAL 30 DAY
     ORDER BY timestamp DESC LIMIT ${Math.min(100, Math.max(1, Math.floor(limit)))}`,
    "activity",
  );
  return rows.map(([at, event, feather]) => ({ at: String(at), text: describeEvent(String(event), str(feather)) }));
}

export function formatDuration(seconds: number) {
  const s = Math.round(seconds);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}
