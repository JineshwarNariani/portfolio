"use client";

import { useEffect } from "react";
import { startAnalytics } from "@/lib/analytics/analytics";
import { installHistoryIntent } from "@/lib/analytics/intent";

/**
 * Starts anonymous analytics once for the portfolio (not on /admin or /privacy).
 * PostHog loads lazily after the page is interactive; if it is disabled,
 * unconfigured or blocked, nothing else is affected.
 */
export function AnalyticsProvider() {
  useEffect(() => {
    installHistoryIntent();
    startAnalytics();
  }, []);
  return null;
}
