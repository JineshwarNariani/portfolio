/**
 * Analytics configuration from environment variables (public, client-safe).
 *
 * NEXT_PUBLIC_POSTHOG_KEY           project API key (public by design)
 * NEXT_PUBLIC_POSTHOG_HOST          ingestion host, e.g. https://us.i.posthog.com
 * NEXT_PUBLIC_ANALYTICS_ENABLE_DEV  "true" to send events from `next dev` (off by default,
 *                                   so development never pollutes the production project)
 * NEXT_PUBLIC_ANALYTICS_DEBUG       "true" to console.log every event + sanitized properties
 */
const key = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "";
const isProd = process.env.NODE_ENV === "production";
const devOptIn = process.env.NEXT_PUBLIC_ANALYTICS_ENABLE_DEV === "true";

export const analyticsConfig = {
  key,
  host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
  /** Whether events are actually sent. */
  enabled: key !== "" && (isProd || devOptIn),
  debug: process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === "true",
  /** Active-time rules. */
  inactivityTimeoutMs: 45_000,
  /** A heartbeat is sent after each minute of ACTIVE time (never while idle). */
  heartbeatActiveMs: 60_000,
  tickMs: 5_000,
  /** Cap on journey length sent with session_completed. */
  maxJourney: 40,
  /** Hover counts as intent only after this long (once per feather per session). */
  hoverIntentMs: 750,
} as const;
