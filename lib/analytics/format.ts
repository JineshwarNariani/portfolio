/** Display helpers for the dashboard (times shown in ANALYTICS_TIMEZONE, default America/New_York). */
const tz = process.env.ANALYTICS_TIMEZONE || "America/New_York";

export function formatDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", { timeZone: tz, month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function formatTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit" });
}

export function formatBucket(iso: string, hourly: boolean) {
  const d = new Date(iso);
  return hourly
    ? d.toLocaleTimeString("en-US", { timeZone: tz, hour: "numeric" })
    : d.toLocaleDateString("en-US", { timeZone: tz, month: "short", day: "numeric" });
}

export const anonLabel = (sessionId: string) => `anon-${sessionId.replace(/-/g, "").slice(0, 6)}`;
