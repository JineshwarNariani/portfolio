"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";

// Client-side route changes since this page loaded. If there are none, "back"
// would leave the site, so we go home instead.
let inAppNavigations = 0;

/** True once the visitor has moved between routes without a full page load. */
export const hasNavigatedInApp = () => inAppNavigations > 0;

/** Mount once in the shared layout. */
export function useTrackNavigation() {
  const pathname = usePathname();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    inAppNavigations++;
  }, [pathname]);
}

/** Go back within the site if possible; otherwise to the peacock. */
export function useBackToPeacock() {
  const router = useRouter();
  return useCallback(() => {
    if (inAppNavigations > 0) router.back();
    else router.push("/");
  }, [router]);
}
