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

export function hasAnalyticsConsent(): boolean {
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
