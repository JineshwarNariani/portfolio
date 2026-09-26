"use client";

import { useCallback, useEffect, useRef } from "react";
import { useDialogKeys } from "@/hooks/useDialogKeys";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useViewport } from "@/hooks/useViewport";
import { useGuestbook } from "./GuestbookProvider";

const WIDTH = 320;

function linkLabel(url: string) {
  try {
    return new URL(url).hostname.includes("linkedin.") ? "LinkedIn" : "Website";
  } catch {
    return "Link";
  }
}

/**
 * The note attached to a caught feather: a small editorial card beside it
 * (desktop) or a plain bottom sheet (mobile). Closing lets the feather drift on.
 */
export function GuestFeatherMessage() {
  const { note, entries, closeNote, openForm } = useGuestbook();
  const vp = useViewport();
  const mobile = useMediaQuery("(max-width: 699px)");
  const ref = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLParagraphElement>(null);
  const entry = note ? entries.get(note.id) : undefined;

  const closeByEscape = useCallback(() => closeNote("escape"), [closeNote]);
  useDialogKeys(ref, !!entry, closeByEscape);

  useEffect(() => {
    if (!entry) return;
    heading.current?.focus({ preventScroll: true });
    const onPointer = (e: PointerEvent) => {
      const t = e.target as HTMLElement;
      if (!ref.current?.contains(t) && !t.closest("[data-guest]")) closeNote("outside_click");
    };
    window.addEventListener("pointerdown", onPointer);
    return () => window.removeEventListener("pointerdown", onPointer);
  }, [entry, closeNote]);

  if (!note || !entry) return null;

  const style = mobile
    ? undefined
    : {
        left: Math.max(16, Math.min(note.anchor.x + (note.anchor.x > vp.w / 2 ? -WIDTH - 28 : 28), vp.w - WIDTH - 16)),
        top: Math.max(84, Math.min(note.anchor.y - 60, vp.h - 260)),
        width: WIDTH,
      };

  return (
    <div ref={ref} className="guest-note" data-sheet={mobile || undefined} style={style} role="dialog" aria-labelledby="guest-note-from">
      <span className="guest-note-rule" aria-hidden="true" />
      <p id="guest-note-from" ref={heading} tabIndex={-1} className="guest-note-from">
        {entry.name ? `A note from ${entry.name}` : "A note, left anonymously"}
      </p>
      <blockquote className="guest-note-message">“{entry.message}”</blockquote>
      <div className="guest-note-actions">
        {entry.url && (
          <a href={entry.url} target="_blank" rel="noopener noreferrer nofollow ugc">
            {linkLabel(entry.url)} <span aria-hidden="true">↗</span>
          </a>
        )}
        <button type="button" onClick={() => closeNote("button")}>
          Let it drift
        </button>
        <button type="button" className="guest-note-leave" onClick={() => openForm("guest_note")}>
          Leave your own
        </button>
      </div>
    </div>
  );
}
