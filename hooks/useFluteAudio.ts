"use client";

import { useSyncExternalStore } from "react";
import { fluteAudio } from "@/lib/audio/fluteAudio";

export function useFluteAudio() {
  const on = useSyncExternalStore(fluteAudio.subscribe, fluteAudio.getSnapshot, fluteAudio.getServerSnapshot);
  return { on, toggle: fluteAudio.toggle };
}
