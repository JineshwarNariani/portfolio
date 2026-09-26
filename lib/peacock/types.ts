/** Shapes of the data emitted by scripts/extract_peacock.py. Coordinates are SVG user units (500×500 artboard). */
export type Point = readonly [number, number];

export interface ArtPart {
  d: string;
  /** Solid colour or `url(#gradient-id)`. */
  fill: string;
  clip?: string[];
}

export interface ArtGradient {
  id: string;
  type: "linear" | "radial";
  /** linear: [x1 y1 x2 y2]; radial: [fx fy fr cx cy r] — in gradient space. */
  coords: number[];
  transform: string;
  stops: [number, string][];
}

export interface ArtFeather {
  /** 0 = lowest-left … 14 = lowest-right. Also the original paint (z) order. */
  index: number;
  /** Axis angle from the pivot, degrees, SVG convention (y down; −90 = straight up). */
  angle: number;
  /** Distance from the pivot to the feather tip. */
  reach: number;
  /** Midpoint of the axis — the feather's own rotation origin when detached. */
  center: Point;
  eye: Point;
  tip: Point;
  /** Outer blade silhouettes (used for focus outline). */
  hit: string[];
  blade: ArtPart[];
  eyeParts: ArtPart[];
}

export interface PeacockArt {
  /** Bounding box of the whole illustration: [x, y, w, h]. */
  box: [number, number, number, number];
  /** Where every feather radiates from. */
  pivot: Point;
  chest: Point;
  bodyBox: [number, number, number, number];
  feet: Point;
  bodyHit: string;
  clips: { id: string; d: string }[];
  gradients: ArtGradient[];
  backers: { angle: number; part: ArtPart }[];
  feathers: ArtFeather[];
  body: ArtPart[];
}
