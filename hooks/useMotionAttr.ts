"use client";

import { useEffect, type RefObject } from "react";
import type { MotionValue } from "motion/react";

/**
 * Writes an SVG attribute whenever any of the given Motion values change —
 * no React re-render per frame. `build` reads the values' current state.
 */
export function useMotionAttr(
  ref: RefObject<SVGElement | null>,
  attr: string,
  values: MotionValue<number>[],
  build: () => string,
) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const write = () => el.setAttribute(attr, build());
    write();
    const unsubs = values.map((v) => v.on("change", write));
    return () => unsubs.forEach((u) => u());
    // `values` and `build` are stable for the lifetime of the element.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, attr]);
}
