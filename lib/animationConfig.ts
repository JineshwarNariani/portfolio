/**
 * Every timing, distance and easing used by the peacock lives here.
 * Durations in seconds; distances in screen px unless noted.
 */
export const animationConfig = {
  arrival: {
    /** Body/canvas fade-in. */
    bodyFade: 0.3,
    /** When the centre feather starts opening. */
    centerDelay: 0.3,
    /** Extra delay per ring of feathers outward from the centre. */
    pairStagger: 0.12,
    /** Opening duration for each feather. */
    duration: 0.9,
    /**
     * Non-centre feathers are invisible while folded and fade in as they swing
     * out: they appear after `emergeDelay` and reach full opacity over
     * `emergeDuration` (both fractions of `duration`).
     */
    emergeDelay: 0.1,
    emergeDuration: 0.35,
    /** Folded tail: feathers gathered upright and shortened to this scale. */
    foldedScale: 0.68,
    /** Eye patterns settle in after the fan is open. */
    eyesDelay: 1.45,
    eyesDuration: 0.6,
    /** One gentle gold outline on the chest after the first unfurl of a session. */
    chestHintDuration: 4.5,
    chestHintKey: "pk-chest-hint-shown",
    /** A single, gentle outward nudge across the section feathers, once. */
    hintDelay: 2.3,
    hintStagger: 0.07,
    hintDistance: 5,
    /** Direct deep-link (e.g. /research): intro runs at this fraction of its length. */
    shortFactor: 0.45,
    ease: [0.3, 0.75, 0.25, 1] as const,
  },
  hover: {
    /** Outward shift along the feather's axis. */
    offset: 9,
    scale: 1.015,
    duration: 0.28,
  },
  detach: {
    /** Outward lift before the feather leaves the fan (keeps its angle). */
    liftDistance: 34,
    liftDuration: 0.28,
    travelDuration: 0.72,
    /** Rotation waits until the feather has cleared its neighbours. */
    rotateDelay: 0.18,
    rotateDuration: 0.52,
    ease: [0.45, 0, 0.2, 1] as const,
  },
  return: {
    /** Content leaves first. */
    contentFade: 0.24,
    duration: 0.75,
    /** Last part of the return: the feather slides along its own axis into its slot. */
    slotDuration: 0.26,
    ease: [0.45, 0, 0.2, 1] as const,
  },
  about: {
    /** Scene scale relative to the idle fit. */
    zoomScale: 2.3,
    zoomScaleMobile: 1.7,
    duration: 0.85,
    ease: [0.45, 0, 0.2, 1] as const,
  },
  /** Opacity of the rest of the peacock while a section or About is open. */
  deemphasis: {
    section: 0.2,
    aboutTail: 0.1,
  },
  content: {
    fadeIn: 0.42,
    fadeOut: 0.24,
    shift: 12,
  },
  /** Loose guestbook feathers carried by the wind. Speeds in px/s. */
  guestbook: {
    maxVisible: 7,
    maxVisibleMobile: 3,
    /** Gently swap one visible note for a hidden one this often (when there are more notes than slots). */
    cycleSeconds: 45,
    /** Mean wind speed and extra speed in a gust. */
    windSpeed: 15,
    gustSpeed: 12,
    /** How far (radians) the wind direction wanders from its heading. */
    windWander: 0.6,
    /** Seconds for a feather to catch up with a change in wind — higher is lazier. */
    response: 1.8,
    /** Personal turbulence per feather (px/s). */
    turbulence: 6,
    bobAmplitude: 9,
    bobPeriod: 6.5,
    /** Gentle sway either side of its lean — never a spin. */
    swayDegrees: 11,
    /** Speed multiplier while hovered/focused. */
    hoverSlowdown: 0.08,
    hoverScale: 1.12,
    /** Rendered height of a loose feather (px). */
    featherHeight: 96,
    featherHeightMobile: 80,
    opacity: 0.9,
    /** While a section, About or Quick View is open. */
    dimmedOpacity: 0.16,
    fadeIn: 1.2,
    fadeOut: 2.4,
    /** Keep clear of the header and the footer line. */
    safeTop: 84,
    safeBottom: 64,
    /** Guest feathers appear after the tail has opened. */
    appearDelay: 2.4,
  },
  reduced: {
    /** Reduced motion: no travel, just short fades. */
    fade: 0.18,
    /** Reduced-motion arrival: the open fan fades in. */
    arrivalFade: 0.45,
    /** Reduced-motion About: a short scale instead of the camera move. */
    zoom: 0.28,
  },
} as const;
