import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isAdmin } from "@/lib/analytics/adminAuth";
import { getSessionTimeline, isSessionId } from "@/lib/analytics/dashboardQueries";
import { anonLabel, formatDateTime } from "@/lib/analytics/format";

export const dynamic = "force-dynamic";

function relative(fromIso: string, iso: string) {
  const s = Math.max(0, Math.round((Date.parse(iso) - Date.parse(fromIso)) / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

/** One anonymous session as a timeline of sanitized events. */
export default async function SessionDetail({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) redirect("/admin/analytics");
  const { id } = await params;
  if (!isSessionId(id)) notFound();

  let rows: Awaited<ReturnType<typeof getSessionTimeline>> | null = null;
  try {
    rows = await getSessionTimeline(id);
  } catch {
    rows = null;
  }

  return (
    <section className="admin-inner">
      <Link href="/admin/analytics" className="admin-link">
        ← All sessions
      </Link>
      <h1>{anonLabel(id)}</h1>
      {rows === null ? (
        <p className="admin-error">Couldn’t load this session from PostHog.</p>
      ) : rows.length === 0 ? (
        <p className="admin-muted">No events for this session.</p>
      ) : (
        <>
          <p className="admin-muted">Started {formatDateTime(rows[0].at)}</p>
          <table className="admin-table admin-timeline">
            <thead>
              <tr>
                <th>Time</th>
                <th>Event</th>
                <th>Section</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td className="admin-mono">{relative(rows![0].at, r.at)}</td>
                  <td className="admin-mono">{r.event}</td>
                  <td>{r.section || "—"}</td>
                  <td className="admin-muted">{r.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </section>
  );
}
