"use client";

import { useSyncExternalStore } from "react";

const noop = () => () => {};

/** true after hydration; false during SSR and the hydration pass. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}
