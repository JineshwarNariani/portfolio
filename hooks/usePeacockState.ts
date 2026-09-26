"use client";

import { useReducer } from "react";
import { isFeatherId, type FeatherId } from "@/data/featherConfig";

/**
 * The peacock is a single finite-state machine. Stable states: idle,
 * sectionOpen, aboutOpen. Everything else is a transition that ends with an
 * explicit completion event dispatched by the choreography.
 */
export type PeacockState =
  | { type: "initial" }
  | { type: "tailOpening" }
  | { type: "idle" }
  | { type: "featherSelected"; id: FeatherId }
  | { type: "sectionOpen"; id: FeatherId }
  /** `slotted`: the feather has re-entered its original paint order for the final slide home. */
  | { type: "featherReturning"; id: FeatherId; slotted: boolean }
  | { type: "aboutZoom" }
  | { type: "aboutOpen" }
  | { type: "aboutReturning" };

export type PeacockEvent =
  | { type: "INTRO_START" }
  | { type: "INTRO_DONE" }
  | { type: "SELECT"; id: FeatherId }
  | { type: "DETACHED" }
  | { type: "CLOSE" }
  | { type: "SLOTTED" }
  | { type: "RETURNED" }
  | { type: "ABOUT" }
  | { type: "ZOOMED" }
  | { type: "ABOUT_CLOSE" }
  | { type: "ABOUT_RETURNED" };

export function peacockReducer(state: PeacockState, event: PeacockEvent): PeacockState {
  switch (state.type) {
    case "initial":
      return event.type === "INTRO_START" ? { type: "tailOpening" } : state;
    case "tailOpening":
      return event.type === "INTRO_DONE" ? { type: "idle" } : state;
    case "idle":
      if (event.type === "SELECT") return { type: "featherSelected", id: event.id };
      if (event.type === "ABOUT") return { type: "aboutZoom" };
      return state;
    case "featherSelected":
      return event.type === "DETACHED" ? { type: "sectionOpen", id: state.id } : state;
    case "sectionOpen":
      return event.type === "CLOSE" ? { type: "featherReturning", id: state.id, slotted: false } : state;
    case "featherReturning":
      if (event.type === "SLOTTED") return { ...state, slotted: true };
      return event.type === "RETURNED" ? { type: "idle" } : state;
    case "aboutZoom":
      return event.type === "ZOOMED" ? { type: "aboutOpen" } : state;
    case "aboutOpen":
      return event.type === "ABOUT_CLOSE" ? { type: "aboutReturning" } : state;
    case "aboutReturning":
      return event.type === "ABOUT_RETURNED" ? { type: "idle" } : state;
  }
}

export function usePeacockState() {
  return useReducer(peacockReducer, { type: "initial" });
}

/** What the URL asks for. The machine walks toward it one transition at a time. */
export type RouteTarget = { kind: "home" } | { kind: "about" } | { kind: "section"; id: FeatherId };

export function routeTarget(pathname: string): RouteTarget {
  const seg = pathname.replace(/^\/+|\/+$/g, "");
  if (seg === "about") return { kind: "about" };
  if (isFeatherId(seg)) return { kind: "section", id: seg };
  return { kind: "home" };
}

/** The feather currently lifted out of the fan, if any. */
export function activeFeather(state: PeacockState): FeatherId | null {
  return state.type === "featherSelected" || state.type === "sectionOpen" || state.type === "featherReturning"
    ? state.id
    : null;
}
