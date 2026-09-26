import { memo } from "react";
import { peacockArt } from "@/lib/peacock/art.generated";

/** The artwork's gradients and clip paths, exactly as extracted from the .ai file. */
export const PeacockDefs = memo(function PeacockDefs() {
  return (
    <defs>
      {peacockArt.clips.map((c) => (
        <clipPath key={c.id} id={c.id} clipPathUnits="userSpaceOnUse">
          <path d={c.d} />
        </clipPath>
      ))}
      {peacockArt.gradients.map((g) => {
        const stops = g.stops.map(([o, c], i) => <stop key={i} offset={o} stopColor={c} />);
        const [a, b, c, d, e, f] = g.coords;
        return g.type === "linear" ? (
          <linearGradient key={g.id} id={g.id} gradientUnits="userSpaceOnUse" x1={a} y1={b} x2={c} y2={d} gradientTransform={g.transform}>
            {stops}
          </linearGradient>
        ) : (
          <radialGradient key={g.id} id={g.id} gradientUnits="userSpaceOnUse" fx={a} fy={b} fr={c} cx={d} cy={e} r={f} gradientTransform={g.transform}>
            {stops}
          </radialGradient>
        );
      })}
    </defs>
  );
});
