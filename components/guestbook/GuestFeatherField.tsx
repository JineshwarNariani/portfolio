"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useViewport } from "@/hooks/useViewport";
import { animationConfig } from "@/lib/animationConfig";
import { restingPosition, spawn, step, transformOf, windAt, type Particle } from "@/lib/guestbook/wind";
import { peacockArt } from "@/lib/peacock/art.generated";
import { fitPose, toScreen } from "@/lib/peacock/layout";
import { GUEST_FEATHER_ASPECT, GuestFeather } from "./GuestFeather";
import { useGuestbook } from "./GuestbookProvider";

const cfg = animationConfig.guestbook;

/**
 * The wind layer. Sits BEHIND the peacock (so it can never intercept a
 * peacock click) and below the header and panels. One requestAnimationFrame
 * loop moves at most a handful of feathers by writing `transform`/`opacity`
 * straight onto their elements — React only renders when the set of notes changes.
 */
export function GuestFeatherField() {
  const { slots, entries, retired, note, openNote } = useGuestbook();
  const pathname = usePathname();
  const vp = useViewport();
  const reduced = useReducedMotion();
  const mobile = useMediaQuery("(max-width: 699px)");
  const dimmed = pathname !== "/";

  // What the loop needs, always current, without restarting it.
  const container = useRef<HTMLDivElement>(null);
  const particles = useRef(new Map<string, Particle>());
  const live = useRef({ slots, vp, reduced, noteId: note?.id ?? null, hovered: null as string | null, retired });
  useEffect(() => {
    live.current = { ...live.current, slots, vp, reduced, noteId: note?.id ?? null, retired };
  });

  // Mobile carries fewer notes.
  const active = slots.filter((s) => !s.retiring);
  const limit = mobile ? cfg.maxVisibleMobile : cfg.maxVisible;
  const shownIds = new Set(active.slice(0, limit).map((s) => s.id));
  const shown = slots.filter((s) => shownIds.has(s.id) || s.retiring);

  // The feather is small; the touch/click target around it is generous.
  const height = mobile ? cfg.featherHeightMobile : cfg.featherHeight;
  const pad = mobile ? 18 : 12;
  const hit = {
    padding: `${pad}px`,
    marginLeft: -(height * GUEST_FEATHER_ASPECT) / 2 - pad,
    marginTop: -height / 2 - pad,
  };

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const t0 = last;

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = (now - t0) / 1000;
      const { slots: current, vp: b, reduced: still, noteId, hovered } = live.current;
      const wind = windAt(t);
      const els = container.current?.querySelectorAll<HTMLElement>("[data-guest]") ?? [];
      const pivot = toScreen(fitPose(b), peacockArt.pivot);

      els.forEach((el, index) => {
        const id = el.dataset.guest!;
        const slot = current.find((s) => s.id === id);
        let p = particles.current.get(id);
        if (!p) {
          const origin = slot?.origin === "peacock" ? "point" : slot?.origin === "edge" ? "edge" : "initial";
          p = spawn(id, origin, b, { x: pivot[0], y: pivot[1] });
          particles.current.set(id, p);
        }
        const retiring = slot?.retiring ?? true;

        if (still) {
          const rest = restingPosition(index, els.length, b);
          p.x = rest.x;
          p.y = rest.y;
          p.rot = rest.rot;
          p.bobPhase = 0;
        } else {
          const target = id === noteId ? 0 : id === hovered ? cfg.hoverSlowdown : 1;
          step(p, dt, t, wind, b, target);
        }

        const focus = id === hovered || id === noteId;
        p.scale += ((focus ? cfg.hoverScale : 1) - p.scale) * Math.min(1, dt * 6);
        const targetOpacity = retiring ? 0 : focus ? 1 : cfg.opacity;
        const rate = retiring ? 1 / cfg.fadeOut : 1 / cfg.fadeIn;
        p.opacity += Math.sign(targetOpacity - p.opacity) * Math.min(Math.abs(targetOpacity - p.opacity), dt * rate);

        el.style.transform = transformOf(p);
        el.style.opacity = p.opacity.toFixed(3);

        if (retiring && p.opacity <= 0.01 && !p.retired) {
          p.retired = true;
          particles.current.delete(id);
          live.current.retired(id);
        }
      });
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      ref={container}
      className="guest-field"
      data-dimmed={dimmed || undefined}
      aria-label="Notes left by visitors, drifting as feathers"
      role="region"
    >
      <div className="guest-field-appear">
      {shown.map((slot) => {
        const entry = entries.get(slot.id);
        if (!entry) return null;
        const who = entry.name ? `from ${entry.name}` : "left anonymously";
        return (
          <button
            key={slot.id}
            type="button"
            data-guest={slot.id}
            className="guest-feather"
            style={hit}
            aria-label={`A feather ${who} — read the note`}
            tabIndex={dimmed ? -1 : 0}
            onPointerEnter={() => (live.current.hovered = slot.id)}
            onPointerLeave={() => live.current.hovered === slot.id && (live.current.hovered = null)}
            onFocus={() => (live.current.hovered = slot.id)}
            onBlur={() => live.current.hovered === slot.id && (live.current.hovered = null)}
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              openNote(slot.id, { x: r.left + r.width / 2, y: r.top + r.height / 2 });
            }}
          >
            <GuestFeather height={height} />
          </button>
        );
      })}
      </div>
    </div>
  );
}
