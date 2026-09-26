"use client";

import { useFluteAudio } from "@/hooks/useFluteAudio";

/** A single quiet line of text: "♪ Flute · Off". Gold when playing. */
export function FluteSoundControl() {
  const { on, toggle } = useFluteAudio();
  return (
    <button
      type="button"
      className="flute-control"
      aria-pressed={on}
      data-on={on || undefined}
      onClick={toggle}
      title={on ? "Fade the flute out" : "Play ambient flute (quiet)"}
    >
      <span aria-hidden="true">♪</span> Flute <span className="flute-state">· {on ? "On" : "Off"}</span>
    </button>
  );
}
