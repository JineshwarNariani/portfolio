/**
 * A stopwatch that only runs while the page is visible — used for section,
 * About, Quick View and guest-note dwell times. Hidden-tab time never counts.
 */
export interface DwellTimer {
  /** Stop and return visible milliseconds. Idempotent. */
  stop(): number;
}

export function startDwell(): DwellTimer {
  if (typeof document === "undefined") return { stop: () => 0 };
  let total = 0;
  let since: number | null = document.visibilityState === "visible" ? performance.now() : null;
  let stopped = false;

  const onVisibility = () => {
    const now = performance.now();
    if (document.visibilityState === "hidden" && since !== null) {
      total += now - since;
      since = null;
    } else if (document.visibilityState === "visible" && since === null) {
      since = now;
    }
  };
  document.addEventListener("visibilitychange", onVisibility);

  return {
    stop() {
      if (!stopped) {
        stopped = true;
        if (since !== null) total += performance.now() - since;
        document.removeEventListener("visibilitychange", onVisibility);
      }
      return Math.round(total);
    },
  };
}
