"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { animationConfig } from "@/lib/animationConfig";
import type { GuestbookEntry, NewGuestbookEntry } from "@/lib/guestbook/types";
import { trackGuestbookOpened, trackGuestFeatherClicked, trackGuestMessageClosed } from "@/lib/analytics/analytics";
import type { GuestbookOpenMethod, GuestMessageCloseMethod } from "@/lib/analytics/events";
import { guestbookService, type CreateResult } from "@/services/guestbookService";

/**
 * Guestbook state — deliberately separate from the peacock state machine.
 *
 * `slots` are the notes currently on the wind. When there are more notes than
 * slots, one is gently swapped out every `cycleSeconds`: the newcomer enters on
 * the wind and the oldest fades away (`retiring`) before it is removed.
 */
export interface Slot {
  id: string;
  origin: "initial" | "edge" | "peacock";
  retiring: boolean;
}

export interface NoteAnchor {
  x: number;
  y: number;
}

interface GuestbookContextValue {
  entries: Map<string, GuestbookEntry>;
  slots: Slot[];
  retired: (id: string) => void;
  /** Leave-a-feather form. */
  formOpen: boolean;
  openForm: (method: GuestbookOpenMethod) => void;
  closeForm: () => void;
  create: (input: NewGuestbookEntry & { website?: string }) => Promise<CreateResult>;
  /** The note currently being read. */
  note: { id: string; anchor: NoteAnchor } | null;
  openNote: (id: string, anchor: NoteAnchor) => void;
  closeNote: (method: GuestMessageCloseMethod) => void;
}

const GuestbookContext = createContext<GuestbookContextValue | null>(null);

export function useGuestbook() {
  const ctx = useContext(GuestbookContext);
  if (!ctx) throw new Error("useGuestbook must be used inside <GuestbookProvider>");
  return ctx;
}

const MAX = animationConfig.guestbook.maxVisible;

/** Add `slot` at the front; if that overfills the wind, retire the oldest active note. */
function admit(slots: Slot[], slot: Slot): Slot[] {
  const next = [slot, ...slots.filter((s) => s.id !== slot.id)];
  const active = next.filter((s) => !s.retiring);
  if (active.length <= MAX) return next;
  const oldest = active[active.length - 1].id;
  return next.map((s) => (s.id === oldest ? { ...s, retiring: true } : s));
}

export function GuestbookProvider({ children }: { children: ReactNode }) {
  const [list, setList] = useState<GuestbookEntry[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [note, setNote] = useState<GuestbookContextValue["note"]>(null);
  const cursor = useRef(0);
  const slotsRef = useRef<Slot[]>([]);
  useEffect(() => {
    slotsRef.current = slots;
  }, [slots]);

  useEffect(() => {
    let alive = true;
    guestbookService.getEntries().then((all) => {
      if (!alive) return;
      setList(all);
      setSlots(all.slice(0, MAX).map((e) => ({ id: e.id, origin: "initial", retiring: false })));
      cursor.current = Math.min(MAX, all.length);
    });
    return () => {
      alive = false;
    };
  }, []);

  // Gentle rotation when there are more notes than the wind can carry.
  useEffect(() => {
    if (list.length <= MAX) return;
    const id = window.setInterval(() => {
      const shown = new Set(slotsRef.current.map((s) => s.id));
      for (let i = 0; i < list.length; i++) {
        const candidate = list[(cursor.current + i) % list.length];
        if (shown.has(candidate.id)) continue;
        cursor.current = (cursor.current + i + 1) % list.length;
        setSlots((current) => admit(current, { id: candidate.id, origin: "edge", retiring: false }));
        return;
      }
    }, animationConfig.guestbook.cycleSeconds * 1000);
    return () => window.clearInterval(id);
  }, [list]);

  const retired = useCallback((id: string) => setSlots((s) => s.filter((x) => x.id !== id || !x.retiring)), []);

  // Pending notes are NOT added to the wind — they appear only once approved.
  const create = useCallback((input: NewGuestbookEntry & { website?: string }) => guestbookService.createEntry(input), []);

  const value = useMemo<GuestbookContextValue>(
    () => ({
      entries: new Map(list.map((e) => [e.id, e])),
      slots,
      retired,
      formOpen,
      openForm: (method) => {
        if (note) trackGuestMessageClosed("leave_your_own");
        trackGuestbookOpened(method);
        setNote(null);
        setFormOpen(true);
      },
      closeForm: () => setFormOpen(false),
      create,
      note,
      openNote: (id, anchor) => {
        const entry = list.find((e) => e.id === id);
        if (!entry) return;
        if (note && note.id !== id) trackGuestMessageClosed("another_feather");
        if (note?.id !== id) trackGuestFeatherClicked(entry);
        setNote({ id, anchor });
      },
      closeNote: (method) => {
        trackGuestMessageClosed(method);
        setNote(null);
      },
    }),
    [list, slots, retired, formOpen, create, note],
  );

  return <GuestbookContext.Provider value={value}>{children}</GuestbookContext.Provider>;
}
