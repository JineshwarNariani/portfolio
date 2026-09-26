"use client";

import { useEffect, useState } from "react";
import { deviceExclusion, setDeviceExcluded } from "@/lib/analytics/consent";

/**
 * Keeps the owner's own visits out of analytics. Opening an admin page marks
 * this browser as excluded the first time (only the owner can get here); the
 * button lets it be switched back on deliberately.
 */
export function ExcludeDeviceToggle() {
  const [excluded, setExcluded] = useState<boolean | null>(null);

  useEffect(() => {
    if (deviceExclusion() === null) setDeviceExcluded(true);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads localStorage once on mount
    setExcluded(deviceExclusion() === "1");
  }, []);

  if (excluded === null) return null;
  return (
    <button
      type="button"
      className="admin-link"
      title={excluded ? "Your visits from this browser aren’t counted" : "Your visits from this browser are counted"}
      onClick={() => {
        setDeviceExcluded(!excluded);
        setExcluded(!excluded);
      }}
    >
      {excluded ? "This browser: not tracked" : "This browser: tracked"}
    </button>
  );
}
