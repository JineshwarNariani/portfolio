"use client";

import { useRef } from "react";
import { useMotionAttr } from "@/hooks/useMotionAttr";
import { peacockArt } from "@/lib/peacock/art.generated";
import { aboutPoint, type PeacockValues } from "@/lib/peacock/values";
import { ArtPath } from "./ArtPath";

const [PX, PY] = peacockArt.pivot;

function Backer({ index, values }: { index: number; values: PeacockValues["backers"][number] }) {
  const ref = useRef<SVGGElement>(null);
  const build = () => aboutPoint(PX, PY, values.fold.get(), values.foldScale.get());
  useMotionAttr(ref, "transform", [values.fold, values.foldScale], build);
  useMotionAttr(ref, "opacity", [values.opacity], () => String(values.opacity.get()));
  return (
    <g ref={ref} transform={build()} opacity={values.opacity.get()}>
      <ArtPath part={peacockArt.backers[index].part} />
    </g>
  );
}

/** The pale-mint scalloped shapes behind the fan. Decorative; they open with it. */
export function Backers({ values }: { values: PeacockValues }) {
  const ref = useRef<SVGGElement>(null);
  useMotionAttr(ref, "opacity", [values.backerOpacity], () => String(values.backerOpacity.get()));
  return (
    <g ref={ref} opacity={values.backerOpacity.get()} aria-hidden="true" className="pk-decorative">
      {values.backers.map((b, i) => (
        <Backer key={i} index={i} values={b} />
      ))}
    </g>
  );
}
