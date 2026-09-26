"use client";

import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence } from "motion/react";
import { featherById, featherByIndex, interactiveFeathers, type FeatherId } from "@/data/featherConfig";
import { useHydrated } from "@/hooks/useHydrated";
import { useMotionAttr } from "@/hooks/useMotionAttr";
import { activeFeather, routeTarget, usePeacockState, type PeacockState } from "@/hooks/usePeacockState";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useViewport } from "@/hooks/useViewport";
import { peacockArt } from "@/lib/peacock/art.generated";
import {
  detachFeather,
  hintFeathers,
  hoverFeather,
  openTail,
  returnFeather,
  snapStable,
  zoomOut,
  zoomToChest,
  type Context,
} from "@/lib/peacock/choreography";
import { fitPose } from "@/lib/peacock/layout";
import { animationConfig } from "@/lib/animationConfig";
import { createPeacockValues } from "@/lib/peacock/values";
import {
  startSectionDwell,
  trackAboutClosed,
  trackAboutOpened,
  trackFeatherClosed,
  trackFeatherHover,
  trackFeatherOpened,
  trackTailUnfurled,
} from "@/lib/analytics/analytics";
import type { AboutOpenMethod, CloseMethod, FeatherOpenMethod } from "@/lib/analytics/events";
import { setIntent, takeIntent } from "@/lib/analytics/intent";
import { AboutPanel } from "@/components/portfolio/AboutPanel";
import { SectionPanel } from "@/components/portfolio/SectionPanel";
import { Backers } from "./Backers";
import { DecorativeFeather } from "./DecorativeFeather";
import { FeatherLabel, SceneCue } from "./SceneOverlays";
import { InteractiveFeather } from "./InteractiveFeather";
import { PeacockBody } from "./PeacockBody";
import { PeacockDefs } from "./PeacockDefs";

const INTERACTIVE_INDICES = interactiveFeathers.map((f) => f.featherIndex);

/**
 * The whole site: one peacock, one state machine.
 *
 * The URL says where we want to be; the machine walks there one explicit
 * transition at a time (a section always returns home before another opens).
 */
export function PeacockScene() {
  const router = useRouter();
  const pathname = usePathname();
  const target = routeTarget(pathname);
  const targetKey = target.kind === "section" ? target.id : target.kind;

  const vp = useViewport();
  const reduced = useReducedMotion();
  const hydrated = useHydrated();
  const [state, dispatch] = usePeacockState();
  const [values] = useState(() => createPeacockValues(fitPose(vp)));
  const [hover, setHover] = useState<FeatherId | "about" | null>(null);
  // One gentle gold outline on the chest after the first unfurl of a session.
  const [chestHint, setChestHint] = useState(false);

  // Latest values for async choreography and event handlers.
  const live = useRef({ vp, reduced, state, targetKind: target.kind });
  useEffect(() => {
    live.current = { vp, reduced, state, targetKind: target.kind };
  });
  const ctx = (): Context => ({ vp: live.current.vp, reduced: live.current.reduced });

  const restoreFocus = useRef<FeatherId | "about" | null>(null);
  // Analytics: a visit that starts on /research (etc.) opens that section by "direct_route".
  const directRoute = useRef(target.kind !== "home");
  const hoverStart = useRef(new Map<FeatherId, number>());

  // --- Scene group transform -------------------------------------------------
  const groupRef = useRef<SVGGElement>(null);
  const g = values.group;
  const groupAttr = () => `translate(${g.x.get()} ${g.y.get()}) scale(${g.scale.get()})`;
  useMotionAttr(groupRef, "transform", [g.x, g.y, g.scale], groupAttr);

  // --- Arrival ----------------------------------------------------------------
  useEffect(() => {
    if (state.type === "initial") dispatch({ type: "INTRO_START" });
  }, [state.type, dispatch]);

  // --- Transition choreography: each transient state runs its sequence, then reports back.
  const stateId = activeFeather(state);
  useEffect(() => {
    const token = { cancelled: false };
    const c = { ...ctx(), token };
    const done = (e: Parameters<typeof dispatch>[0]) => !token.cancelled && dispatch(e);
    const idx = stateId ? featherById[stateId].featherIndex : -1;

    switch (state.type) {
      case "tailOpening": {
        const short = live.current.targetKind !== "home";
        snapStable(values, c.vp, { type: "idle" });
        const t0 = performance.now();
        openTail(values, { ...c, short }).then(() => {
          if (!token.cancelled) trackTailUnfurled(performance.now() - t0, short);
          done({ type: "INTRO_DONE" });
          if (short || token.cancelled) return;
          setTimeout(() => hintFeathers(values, INTERACTIVE_INDICES, ctx()), 350);
          hintChestOnce(setChestHint);
        });
        break;
      }
      case "featherSelected":
        detachFeather(values, idx, c).then(() => done({ type: "DETACHED" }));
        break;
      case "featherReturning":
        returnFeather(values, idx, { ...c, lower: () => done({ type: "SLOTTED" }) }).then(() => done({ type: "RETURNED" }));
        break;
      case "aboutZoom":
        zoomToChest(values, c).then(() => done({ type: "ZOOMED" }));
        break;
      case "aboutReturning":
        zoomOut(values, c).then(() => done({ type: "ABOUT_RETURNED" }));
        break;
    }
    return () => {
      token.cancelled = true;
    };
    // Keyed on the transition, not the state object (SLOTTED must not restart the return).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.type, stateId]);

  // --- Analytics: observe transitions (keyed like the choreography, so each fires once).
  useEffect(() => {
    const openMethod = <T extends string>(): T => {
      const hint = takeIntent<T>("open");
      if (hint) return hint;
      if (directRoute.current) {
        directRoute.current = false;
        return "direct_route" as T;
      }
      return "browser_nav" as T;
    };
    // No explicit hint: heading to another section → another_section; anywhere else (home link, Quick View) → navigation.
    const closeMethod = (): CloseMethod =>
      takeIntent<CloseMethod>("close") ?? (target.kind === "home" ? "navigation" : "another_section");
    switch (state.type) {
      case "featherSelected":
        trackFeatherOpened(state.id, openMethod<FeatherOpenMethod>());
        break;
      case "sectionOpen":
        startSectionDwell(state.id);
        break;
      case "featherReturning":
        trackFeatherClosed(state.id, closeMethod());
        break;
      case "aboutZoom":
        trackAboutOpened(openMethod<AboutOpenMethod>());
        break;
      case "aboutOpen":
        startSectionDwell("about");
        break;
      case "aboutReturning":
        trackAboutClosed(closeMethod());
        break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.type, stateId]);

  // --- Reconcile the machine with the URL (browser back/forward, INDEX, deep links).
  useEffect(() => {
    if (state.type === "idle") {
      if (target.kind === "section") dispatch({ type: "SELECT", id: target.id });
      else if (target.kind === "about") dispatch({ type: "ABOUT" });
    } else if (state.type === "sectionOpen") {
      if (!(target.kind === "section" && target.id === state.id)) dispatch({ type: "CLOSE" });
    } else if (state.type === "aboutOpen") {
      if (target.kind !== "about") dispatch({ type: "ABOUT_CLOSE" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.type, stateId, targetKey, dispatch]);

  // --- After a return, give focus back to the feather (or chest) it came from.
  useEffect(() => {
    if (state.type !== "idle" || !restoreFocus.current) return;
    const sel = restoreFocus.current === "about" ? ".pk-body" : `[data-section="${restoreFocus.current}"]`;
    document.querySelector<SVGElement>(sel)?.focus({ preventScroll: true });
    restoreFocus.current = null;
  }, [state.type]);

  // --- Keep stable states laid out correctly when the window changes size.
  useEffect(() => {
    const s = live.current.state;
    if (s.type === "idle") snapStable(values, vp, { type: "idle" });
    if (s.type === "aboutOpen") snapStable(values, vp, { type: "aboutOpen" });
    if (s.type === "sectionOpen") snapStable(values, vp, { type: "sectionOpen", idx: featherById[s.id].featherIndex });
  }, [vp, values]);

  // --- Interaction ------------------------------------------------------------
  const navigate = useCallback(
    (href: string) => (e: MouseEvent<HTMLAnchorElement>) => {
      // Let modified clicks open a new tab as normal links do.
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      e.preventDefault();
      const s = live.current.state.type;
      if (s !== "idle" && s !== "tailOpening") return;
      setHover(null);
      // e.detail is 0 for keyboard-activated clicks (Enter on a focused link).
      const keyboard = e.detail === 0;
      setIntent("open", keyboard ? "keyboard" : href === "/about" ? "chest_click" : "click");
      router.push(href);
    },
    [router],
  );

  const onHoverFeather = (id: FeatherId, idx: number) => (on: boolean) => {
    if (live.current.state.type !== "idle") return;
    hoverFeather(values, idx, on, ctx());
    setHover(on ? id : null);
    if (on) hoverStart.current.set(id, performance.now());
    else {
      const t = hoverStart.current.get(id);
      if (t !== undefined) trackFeatherHover(id, performance.now() - t);
      hoverStart.current.delete(id);
    }
  };

  const close = useCallback((method: CloseMethod = "close_button") => {
    setIntent("close", method);
    const s = live.current.state;
    restoreFocus.current = s.type === "aboutOpen" ? "about" : s.type === "sectionOpen" ? s.id : null;
    router.push("/");
  }, [router]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = live.current.state.type;
      if (e.key === "Escape" && (s === "sectionOpen" || s === "aboutOpen")) close("escape");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  // --- Render -------------------------------------------------------------------
  const raised = raisedFeather(state);
  const order = peacockArt.feathers.map((f) => f.index).filter((i) => i !== raised);

  const renderFeather = (i: number) => {
    const art = peacockArt.feathers[i];
    const spec = featherByIndex.get(i);
    if (!spec) return <DecorativeFeather key={i} art={art} values={values.feathers[i]} />;
    return (
      <InteractiveFeather
        key={i}
        spec={spec}
        art={art}
        values={values.feathers[i]}
        onActivate={navigate(spec.href)}
        onHover={onHoverFeather(spec.id, i)}
      />
    );
  };

  const fit = fitPose(vp);
  const idle = state.type === "idle";

  return (
    <div
      className="scene"
      data-state={state.type}
      data-ready={hydrated || undefined}
      data-chest-hint={(idle && chestHint) || undefined}
    >
      <svg
        className="scene-svg"
        viewBox={`0 0 ${vp.w} ${vp.h}`}
        role="group"
        aria-label="Peacock — each marked feather opens a section; the chest opens About"
      >
        <PeacockDefs />
        <g ref={groupRef} transform={groupAttr()}>
          <Backers values={values} />
          {order.map(renderFeather)}
          <PeacockBody
            key="body"
            opacity={values.body}
            onActivate={navigate("/about")}
            onHover={(on) => {
              if (live.current.state.type !== "idle") return;
              setHover(on ? "about" : null);
            }}
          />
          {/* A lifted feather is painted above everything, then slotted back into its original order. */}
          {raised !== null && renderFeather(raised)}
        </g>
      </svg>

      <FeatherLabel id={idle && hover && hover !== "about" ? hover : null} group={fit} />
      <SceneCue mode={idle ? (hover === "about" ? "about" : "select") : null} group={fit} />

      <AnimatePresence>
        {state.type === "sectionOpen" && <SectionPanel key={state.id} id={state.id} onReturn={() => close()} />}
        {state.type === "aboutOpen" && <AboutPanel key="about" onReturn={() => close()} />}
      </AnimatePresence>
    </div>
  );
}

/** Index of the feather painted on top, if one is lifted out of the fan. */
function raisedFeather(state: PeacockState): number | null {
  const id = activeFeather(state);
  if (!id) return null;
  if (state.type === "featherReturning" && state.slotted) return null;
  return featherById[id].featherIndex;
}

/** Outline the chest once per session so "the peacock is clickable too" is discoverable. */
function hintChestOnce(set: (v: boolean) => void) {
  const { chestHintKey, chestHintDuration } = animationConfig.arrival;
  try {
    if (sessionStorage.getItem(chestHintKey)) return;
    sessionStorage.setItem(chestHintKey, "1");
  } catch {
    /* storage blocked: show it anyway, once per page load */
  }
  set(true);
  setTimeout(() => set(false), chestHintDuration * 1000);
}
