"use client";

import { useSyncExternalStore } from "react";

export interface Viewport {
  w: number;
  h: number;
}

const SERVER: Viewport = { w: 1440, h: 900 };
let cached: Viewport = SERVER;

function read(): Viewport {
  const w = window.innerWidth;
  const h = window.innerHeight;
  if (w !== cached.w || h !== cached.h) cached = { w, h };
  return cached;
}

/** Window size in CSS px. The scene's SVG uses this as its viewBox so 1 unit = 1 px. */
export function useViewport(): Viewport {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener("resize", cb);
      return () => window.removeEventListener("resize", cb);
    },
    read,
    () => SERVER,
  );
}
