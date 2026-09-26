import { peacockArt } from "@/lib/peacock/art.generated";

/**
 * Which feathers of the artwork are navigation, and what they lead to.
 *
 * The fan has 15 feathers (index 0 = lowest-left … 14 = lowest-right). Every
 * other feather is interactive, so the seven sections sit symmetrically with a
 * decorative feather between each — and read left→right in the section order,
 * with Founder at the centre.
 */
export const SECTION_IDS = [
  "experience",
  "projects",
  "research",
  "founder",
  "achievements",
  "writing",
  "contact",
] as const;

export type FeatherId = (typeof SECTION_IDS)[number];

interface FeatherSpec {
  id: FeatherId;
  label: string;
  microLabel: string;
  /** Feather in the artwork this section lives in. */
  featherIndex: number;
}

const SPECS: FeatherSpec[] = [
  { id: "experience", label: "Experience", microLabel: "Where I've Worked", featherIndex: 1 },
  { id: "projects", label: "Projects", microLabel: "Things I've Built", featherIndex: 3 },
  { id: "research", label: "Research", microLabel: "Questions I've Chased", featherIndex: 5 },
  { id: "founder", label: "Founder", microLabel: "What I'm Building Now", featherIndex: 7 },
  { id: "achievements", label: "Achievements", microLabel: "Milestones", featherIndex: 9 },
  { id: "writing", label: "Writing and Speeches", microLabel: "Things I'm Thinking and Speaking About", featherIndex: 11 },
  { id: "contact", label: "Contact", microLabel: "Let's Talk", featherIndex: 13 },
];

export interface InteractiveFeather extends FeatherSpec {
  href: `/${FeatherId}`;
  /**
   * The feather's ORIGINAL placement in the artwork. Every animation is
   * expressed relative to this, and returning restores exactly this.
   */
  original: {
    /** Own rotation origin (axis midpoint), art units. */
    origin: readonly [number, number];
    /** Axis angle from the pivot, degrees (SVG, −90 = up). */
    rotate: number;
    /** Pose offsets in the idle fan. */
    x: 0;
    y: 0;
    scale: 1;
    /** Paint order within the fan (higher = drawn later / on top). */
    layer: number;
  };
}

export const interactiveFeathers: InteractiveFeather[] = SPECS.map((s) => {
  const art = peacockArt.feathers[s.featherIndex];
  return {
    ...s,
    href: `/${s.id}`,
    original: { origin: art.center, rotate: art.angle, x: 0, y: 0, scale: 1, layer: art.index },
  };
});

export const featherById = Object.fromEntries(interactiveFeathers.map((f) => [f.id, f])) as Record<
  FeatherId,
  InteractiveFeather
>;

export const featherByIndex = new Map(interactiveFeathers.map((f) => [f.featherIndex, f]));

export function isFeatherId(v: string): v is FeatherId {
  return (SECTION_IDS as readonly string[]).includes(v);
}
