import Link from "next/link";
import { AdminNav } from "@/components/admin/AdminNav";
import { LoginForm } from "@/components/admin/LoginForm";
import { RecentActivity } from "@/components/admin/RecentActivity";
import { SeriesChart } from "@/components/admin/SeriesChart";
import { adminConfigured, isAdmin } from "@/lib/analytics/adminAuth";
import {
  formatDuration,
  getRecentActivity,
  getLocations,
  getRecentSessions,
  getSectionStats,
  getSeries,
  getSummary,
  parseRange,
  RANGES,
  type Range,
} from "@/lib/analytics/dashboardQueries";
import { anonLabel, formatDateTime, formatTime } from "@/lib/analytics/format";
import { posthogServerConfigured } from "@/lib/analytics/posthogServer";

export const dynamic = "force-dynamic";

/** Each panel loads independently; one failing query never blanks the dashboard. */
async function safe<T>(p: Promise<T>): Promise<T | null> {
  try {
    return await p;
  } catch {
    return null;
  }
}

export default async function AnalyticsDashboard({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  if (!adminConfigured()) {
    return (
      <section className="admin-inner">
        <h1>Analytics</h1>
        <p className="admin-muted">
          The dashboard is disabled. Set <code>ANALYTICS_ADMIN_SECRET</code> (at least 8 characters) to enable it.
        </p>
      </section>
    );
  }
  if (!(await isAdmin())) return <LoginForm failed={params.error === "1"} />;

  const range: Range = parseRange(params.range);
  const configured = posthogServerConfigured();
  const [summary, sections, series, sessions, activity, locations] = configured
    ? await Promise.all([
        safe(getSummary(range)),
        safe(getSectionStats(range)),
        safe(getSeries(range)),
        safe(getRecentSessions(range)),
        safe(getRecentActivity()),
        safe(getLocations(range)),
      ])
    : [null, null, null, null, null, null];
  const maxOpens = Math.max(1, ...(sections ?? []).map((s) => s.opens));

  return (
    <section className="admin-inner">
      <AdminNav current="analytics" />
      <header className="admin-head">
        <div>
          <h1>Analytics</h1>
          <p className="admin-muted">
            Anonymous interactions with the peacock, with approximate location (city/country). No referrers, IP addresses or
            personal data.
          </p>
        </div>
      </header>

      <nav className="admin-ranges" aria-label="Time range">
        {RANGES.map((r) => (
          <Link key={r.id} href={`/admin/analytics?range=${r.id}`} aria-current={r.id === range ? "page" : undefined}>
            {r.label}
          </Link>
        ))}
      </nav>

      {!configured && (
        <p className="admin-error">
          PostHog isn’t connected. Set <code>POSTHOG_PERSONAL_API_KEY</code> and <code>POSTHOG_PROJECT_ID</code> on the server.
        </p>
      )}

      {/* Summary */}
      <h2>Summary</h2>
      {summary ? (
        <dl className="admin-metrics">
          <Metric label="Visits" value={summary.visits} />
          <Metric label="Unique visitors" value={summary.visitors} />
          <Metric label="Sessions" value={summary.sessions} />
          <Metric label="Avg active time" value={formatDuration(summary.avgActiveSeconds)} />
          <Metric label="Median active time" value={formatDuration(summary.medianActiveSeconds)} />
          <Metric label="Returning visitors" value={`${summary.returningPct.toFixed(0)}%`} />
          <Metric label="Resume clicks" value={summary.resume} />
          <Metric label="Quick View opens" value={summary.quickView} />
          <Metric label="About opens" value={summary.about} />
          <Metric label="Feathers left" value={summary.guestbook} />
          <Metric label="Guest feathers caught" value={summary.guestFeathers} />
          <Metric label="Flute enabled" value={`${summary.audioRatePct.toFixed(0)}% of sessions`} />
        </dl>
      ) : (
        configured && <Unavailable />
      )}

      <div className="admin-two">
        <div>
          <h2>Visits over time</h2>
          {series ? <SeriesChart points={series} hourly={range === "24h"} /> : configured && <Unavailable />}
          <p className="admin-note">Bars: visits. Gold line: resume clicks.</p>
        </div>
        <div>
          <h2>Recent activity</h2>
          {activity ? (
            <RecentActivity initial={activity.map((a) => ({ ...a, time: formatTime(a.at) }))} />
          ) : (
            configured && <Unavailable />
          )}
        </div>
      </div>

      {/* Section popularity */}
      <h2>Sections</h2>
      {sections ? (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Section</th>
              <th>Opens</th>
              <th>Unique sessions</th>
              <th>Avg time viewed</th>
            </tr>
          </thead>
          <tbody>
            {sections.map((s) => (
              <tr key={s.section}>
                <td>
                  <span className="admin-bar-inline" style={{ width: `${(s.opens / maxOpens) * 100}%` }} aria-hidden="true" />
                  {s.label}
                </td>
                <td>{s.opens}</td>
                <td>{s.sessions}</td>
                <td>{s.avgDwellMs ? formatDuration(s.avgDwellMs / 1000) : "—"}</td>
              </tr>
            ))}
            {sections.length === 0 && (
              <tr>
                <td colSpan={4} className="admin-muted">
                  No sections opened in this range.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      ) : (
        configured && <Unavailable />
      )}

      {/* Where visitors are */}
      <h2>Where visitors are</h2>
      {locations ? (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Country</th>
              <th>City</th>
              <th>Visits</th>
              <th>Unique visitors</th>
            </tr>
          </thead>
          <tbody>
            {locations.map((l) => (
              <tr key={`${l.country}-${l.city}`}>
                <td>{l.country}</td>
                <td>{l.city}</td>
                <td>{l.visits}</td>
                <td>{l.visitors}</td>
              </tr>
            ))}
            {locations.length === 0 && (
              <tr>
                <td colSpan={4} className="admin-muted">
                  No visits in this range yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      ) : (
        configured && <Unavailable />
      )}
      <p className="admin-note">Location is estimated from the visitor’s network by PostHog and is often only accurate to the country.</p>

      {/* Journeys */}
      <h2>Recent sessions</h2>
      {sessions ? (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Session</th>
              <th>Started</th>
              <th>Location</th>
              <th>Active</th>
              <th>Sections opened</th>
              <th>Resume</th>
              <th>Quick View</th>
              <th>Guestbook</th>
              <th>Flute</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s.id}>
                <td>
                  <Link href={`/admin/analytics/session/${s.id}`} className="admin-link">
                    {anonLabel(s.id)}
                  </Link>
                </td>
                <td>{formatDateTime(s.startedAt)}</td>
                <td>{s.location || "—"}</td>
                <td>{s.activeSeconds ? formatDuration(s.activeSeconds) : "—"}</td>
                <td className="admin-journey">{s.journey.length ? s.journey.join(" → ") : "—"}</td>
                <td>{s.resume ? "Yes" : "No"}</td>
                <td>{s.quickView ? "Yes" : "No"}</td>
                <td>{s.guestbook ? "Yes" : "No"}</td>
                <td>{s.audio ? "Yes" : "No"}</td>
              </tr>
            ))}
            {sessions.length === 0 && (
              <tr>
                <td colSpan={9} className="admin-muted">
                  No sessions in this range.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      ) : (
        configured && <Unavailable />
      )}
      <p className="admin-note">
        Active time counts only while the page is visible and the visitor has interacted in the last 45 seconds. Sessions
        shorter than a minute may show “—” if the browser closed before reporting.
      </p>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function Unavailable() {
  return <p className="admin-error">Couldn’t load this panel from PostHog. Check the server logs and API key scope (Query Read).</p>;
}
