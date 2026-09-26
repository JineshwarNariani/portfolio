import "server-only";

/**
 * Server-only PostHog access for the private dashboard. The personal API key
 * is read from the environment here and never reaches the browser.
 *
 * POSTHOG_PERSONAL_API_KEY  personal key with the "Query Read" scope
 * POSTHOG_PROJECT_ID        numeric project id
 * POSTHOG_API_HOST          app host (not the ingestion host), e.g. https://us.posthog.com.
 *                           Optional: derived from NEXT_PUBLIC_POSTHOG_HOST when omitted.
 */
const personalKey = process.env.POSTHOG_PERSONAL_API_KEY ?? "";
const projectId = process.env.POSTHOG_PROJECT_ID ?? "";

function apiHost() {
  if (process.env.POSTHOG_API_HOST) return process.env.POSTHOG_API_HOST.replace(/\/$/, "");
  const ingest = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";
  // us.i.posthog.com → us.posthog.com (the query API lives on the app host)
  return ingest.replace("://us.i.", "://us.").replace("://eu.i.", "://eu.").replace(/\/$/, "");
}

export const posthogServerConfigured = () => personalKey !== "" && /^\d+$/.test(projectId);

export class PostHogQueryError extends Error {}

/** Run a HogQL query. Returns rows as arrays, in SELECT order. */
export async function hogql<Row extends unknown[] = unknown[]>(query: string, name: string): Promise<Row[]> {
  if (!posthogServerConfigured()) throw new PostHogQueryError("PostHog server access is not configured.");
  const res = await fetch(`${apiHost()}/api/projects/${projectId}/query/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${personalKey}` },
    body: JSON.stringify({ query: { kind: "HogQLQuery", query }, name: `portfolio-dashboard:${name}` }),
    cache: "no-store",
  });
  if (!res.ok) {
    // Don't surface the upstream body; it may echo the query.
    throw new PostHogQueryError(`PostHog query "${name}" failed (${res.status}).`);
  }
  const data = (await res.json()) as { results?: Row[] };
  return data.results ?? [];
}
