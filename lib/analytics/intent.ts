/**
 * "How did this happen?" hints. UI handlers note the method just before a
 * navigation (click vs keyboard, INDEX, Return button, browser back…); the
 * code that observes the resulting state change reads it. Hints expire so a
 * stale one never mislabels a later action.
 */
type Slot = "open" | "close";
const TTL_MS = 10_000;
const hints = new Map<Slot, { value: string; at: number }>();

export function setIntent(slot: Slot, value: string) {
  hints.set(slot, { value, at: Date.now() });
}

export function takeIntent<T extends string>(slot: Slot): T | undefined {
  const h = hints.get(slot);
  hints.delete(slot);
  return h && Date.now() - h.at < TTL_MS ? (h.value as T) : undefined;
}

let installed = false;
/** Browser back/forward: label the next open/close as history navigation. */
export function installHistoryIntent() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  window.addEventListener("popstate", () => {
    setIntent("open", "browser_nav");
    setIntent("close", "browser_back");
  });
}
