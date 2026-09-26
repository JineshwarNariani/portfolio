"use client";

import { useTrackNavigation } from "@/hooks/useInAppBack";

export function NavigationTracker() {
  useTrackNavigation();
  return null;
}
