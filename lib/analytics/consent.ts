/**
 * Consent seam. Analytics currently runs by default (anonymous, cookieless —
 * PostHog persists an anonymous id in localStorage). If a consent banner is
 * added later, call `setAnalyticsConsent(false|true)` from it and flip
 * `CONSENT_REQUIRED` so nothing is captured until the visitor opts in.
 */
import { optIn, optOut } from "./posthogClient";

const KEY = "pk-analytics-consent";
/** Set true if you add a banner and want opt-in (rather than opt-out) behaviour. */
export const CONSENT_REQUIRED = false;

/**
 * Owner opt-out: a browser marked "excluded" never loads analytics at all, so
 * the site owner's own visits don't pollute the data. Set from the admin pages
 * or by opening any page with `?analytics=off` (`?analytics=on` undoes it).
 */
const EXCLUDE_KEY = "pk-analytics-exclude";

/** "1" = excluded, "0" = explicitly included, null = never chosen. */
export function deviceExclusion(): "1" | "0" | null {
  try {
    const v = localStorage.getItem(EXCLUDE_KEY);
    return v === "1" || v === "0" ? v : null;
  } catch {
    return null;
  }
}

export const isDeviceExcluded = () => deviceExclusion() === "1";

export function setDeviceExcluded(excluded: boolean) {
  try {
    localStorage.setItem(EXCLUDE_KEY, excluded ? "1" : "0");
  } catch {
    /* storage blocked */
  }
  if (excluded) optOut();
}

export function hasAnalyticsConsent(): boolean {
  if (isDeviceExcluded()) return false;
  try {
    const v = localStorage.getItem(KEY);
    if (v === "granted") return true;
    if (v === "denied") return false;
  } catch {
    /* storage blocked */
  }
  return !CONSENT_REQUIRED;
}

export function setAnalyticsConsent(granted: boolean) {
  try {
    localStorage.setItem(KEY, granted ? "granted" : "denied");
  } catch {
    /* storage blocked */
  }
  if (granted) optIn();
  else optOut();
}
