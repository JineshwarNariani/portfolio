/**
 * The only file that touches posthog-js.
 *
 * - Loaded lazily (dynamic import) so it never delays the peacock.
 * - Explicit events only: autocapture, pageviews, heatmaps, dead clicks,
 *   exception capture, surveys, feature flags and session replay are OFF.
 * - No referrer or campaign data: `save_referrer` / `save_campaign_params`
 *   are off, and `before_send` strips any referrer/UTM/click-id property and
 *   reduces URLs to origin + path (no query string or hash).
 * - Cookieless: the anonymous id lives in localStorage.
 * - Location: PostHog's GeoIP adds approximate country/city server-side;
 *   "Discard client IP data" keeps the IP itself from being stored.
 * - Every call is wrapped so analytics can never break the site.
 */
import type { PostHog } from "posthog-js";
import { analyticsConfig as cfg } from "./config";

type Props = Record<string, unknown>;
type CaptureOptions = { transport?: "XHR" | "fetch" | "sendBeacon" };

let client: PostHog | null = null;
let loading: Promise<PostHog | null> | null = null;
const queue: [string, Props, CaptureOptions | undefined][] = [];
const superProps: Props = {};

/** Properties PostHog would otherwise attach that we never want. */
const DENY = [
  "$referrer",
  "$referring_domain",
  "$initial_referrer",
  "$initial_referring_domain",
  "$session_entry_referrer",
  "$session_entry_referring_domain",
  "$search_engine",
  "$initial_search_engine",
  "$raw_user_agent",
  "$ip",
];
/** Anything referrer-, campaign- or ad-click-shaped, whatever PostHog calls it. */
const DENY_PATTERN = /referr|search_engine|utm_|gclid|gbraid|wbraid|gad_|fbclid|msclkid|li_fat_id|ttclid|twclid|rdt_cid|epik|qclid|sccid|irclid|_kx|mc_cid|igshid/i;

function stripUrl(v: unknown) {
  if (typeof v !== "string") return v;
  try {
    const u = new URL(v);
    return `${u.origin}${u.pathname}`;
  } catch {
    return undefined;
  }
}

function scrub(obj: Props | undefined) {
  if (!obj) return;
  for (const k of Object.keys(obj)) {
    if (DENY.includes(k) || DENY_PATTERN.test(k)) delete obj[k];
    // Every URL-valued property loses its query string and hash.
    else if (k.endsWith("_url")) obj[k] = stripUrl(obj[k]);
  }
}

export function load(consented: boolean): Promise<PostHog | null> {
  if (!cfg.enabled || typeof window === "undefined") return Promise.resolve(null);
  loading ??= import("posthog-js")
    .then(({ default: posthog }) => {
      posthog.init(cfg.key, {
        api_host: cfg.host,
        persistence: "localStorage",
        person_profiles: "identified_only",
        autocapture: false,
        capture_pageview: false,
        capture_pageleave: false,
        rageclick: false,
        capture_dead_clicks: false,
        capture_heatmaps: false,
        capture_performance: false,
        capture_exceptions: false,
        disable_session_recording: true,
        disable_surveys: true,
        disable_product_tours: true,
        disable_conversations: true,
        disable_web_experiments: true,
        advanced_disable_flags: true,
        disable_external_dependency_loading: true,
        save_referrer: false,
        save_campaign_params: false,
        mask_personal_data_properties: true,
        property_denylist: DENY,
        opt_out_capturing_by_default: !consented,
        // Debug mode sends readable (uncompressed) payloads so they can be inspected.
        disable_compression: cfg.debug,
        before_send: (event) => {
          if (!event) return event;
          scrub(event.properties as Props);
          scrub(event.$set as Props | undefined);
          scrub(event.$set_once as Props | undefined);
          return event;
        },
      });
      // Approximate location (country/city) is added by PostHog's GeoIP step on
      // the server; the IP itself is then discarded (project setting).
      // Earlier builds persisted `$geoip_disable` in localStorage; drop it so GeoIP runs.
      posthog.unregister("$geoip_disable");
      posthog.register({ ...superProps });
      client = posthog;
      for (const [e, p, o] of queue.splice(0)) safeCapture(e, p, o);
      return posthog;
    })
    .catch(() => null);
  return loading;
}

function safeCapture(event: string, props: Props, options?: CaptureOptions) {
  try {
    client?.capture(event, props, options);
  } catch {
    /* analytics is non-critical */
  }
}

/** Fire-and-forget. Queues until PostHog has loaded. */
export function capture(event: string, props: Props, options?: CaptureOptions) {
  if (!cfg.enabled) return;
  if (client) safeCapture(event, props, options);
  else if (queue.length < 100) queue.push([event, props, options]);
}

/** Properties attached to every subsequent event (e.g. the session id). */
export function registerSuper(props: Props) {
  Object.assign(superProps, props);
  try {
    client?.register(props);
  } catch {
    /* ignore */
  }
}

export function optIn() {
  try {
    client?.opt_in_capturing();
  } catch {
    /* ignore */
  }
}

export function optOut() {
  try {
    client?.opt_out_capturing();
  } catch {
    /* ignore */
  }
}
