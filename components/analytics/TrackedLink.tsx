"use client";

import type { AnchorHTMLAttributes } from "react";
import { linkKindFromLabel, trackLinkClicked } from "@/lib/analytics/analytics";
import type { LinkLocation } from "@/lib/analytics/events";

/**
 * A plain link that reports Resume / LinkedIn / GitHub / Email clicks (by label,
 * never by URL). Tracking is fire-and-forget; navigation is never delayed.
 */
export function TrackedLink({
  label,
  location,
  onClick,
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement> & { label: string; location: LinkLocation }) {
  // Web links (résumé, profiles) open beside the peacock instead of replacing it; mailto stays as is.
  const newTab = /^https?:/.test(rest.href ?? "") ? { target: "_blank", rel: "noopener noreferrer" } : {};
  return (
    <a
      {...newTab}
      {...rest}
      onClick={(e) => {
        const kind = linkKindFromLabel(label);
        if (kind) trackLinkClicked(kind, location);
        onClick?.(e);
      }}
    >
      {label}
    </a>
  );
}
