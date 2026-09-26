"use client";

import { useEffect, useRef } from "react";
import { profile, quickView } from "@/data/portfolioData";
import { TrackedLink } from "@/components/analytics/TrackedLink";
import { hasNavigatedInApp, useBackToPeacock } from "@/hooks/useInAppBack";
import { trackQuickViewClosed, trackQuickViewOpened } from "@/lib/analytics/analytics";
import type { CloseMethod, QuickViewOpenMethod } from "@/lib/analytics/events";
import { setIntent, takeIntent } from "@/lib/analytics/intent";

// Analytics: a dev Strict Mode remount must not count as close + reopen.
let pendingClose: number | null = null;

/**
 * Recruiter Quick View: a plain editorial one-pager over the peacock.
 * The peacock stays mounted underneath, so "Back" returns without replaying anything.
 */
export function QuickView() {
  const backRef = useRef<() => void>(() => {});
  const goBack = useBackToPeacock();
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    const back = (method: CloseMethod) => {
      setIntent("close", method);
      goBack();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && back("escape");
    window.addEventListener("keydown", onKey);
    backRef.current = () => back("close_button");
    return () => window.removeEventListener("keydown", onKey);
  }, [goBack]);

  useEffect(() => {
    if (pendingClose !== null) {
      clearTimeout(pendingClose);
      pendingClose = null;
    } else {
      // Landed here directly (first page of the visit) vs. an in-app navigation.
      const fallback: QuickViewOpenMethod = hasNavigatedInApp() ? "browser_nav" : "direct_route";
      trackQuickViewOpened(takeIntent<QuickViewOpenMethod>("open") ?? fallback);
    }
    return () => {
      pendingClose = window.setTimeout(() => {
        pendingClose = null;
        trackQuickViewClosed(takeIntent<CloseMethod>("close") ?? "navigation");
      }, 0);
    };
  }, []);

  return (
    <section className="quick-view" aria-labelledby="qv-name">
      <div className="qv-inner">
        <div className="qv-bar">
          <button type="button" className="qv-back" onClick={() => backRef.current()}>
            <span aria-hidden="true">←</span> Back to Peacock
          </button>
          <span className="qv-kicker">Quick View</span>
        </div>

        <header className="qv-head">
          <h1 id="qv-name" ref={heading} tabIndex={-1}>
            {profile.name}
          </h1>
          <p className="qv-roles">{profile.roles.join(" · ")}</p>
          <p className="qv-summary">{profile.summary}</p>
        </header>

        <div className="qv-grid">
          {quickView.groups.map((g) => (
            <section key={g.title} className="qv-group" aria-label={g.title}>
              <h2>{g.title}</h2>
              <ul>
                {g.items.map((it) => (
                  <li key={it.name}>
                    <span className="qv-item">{it.name}</span>
                    <span className="qv-detail">{it.detail}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          <section className="qv-group" aria-label="Links">
            <h2>Links</h2>
            <ul className="qv-links">
              {quickView.links.map((l) => (
                <li key={l.label}>
                  <TrackedLink href={l.href} label={l.label} location="quick_view" />
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </section>
  );
}
