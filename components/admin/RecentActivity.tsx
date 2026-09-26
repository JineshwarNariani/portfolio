"use client";

import { useEffect, useState } from "react";

interface Item {
  at: string;
  text: string;
  time: string;
}

/** Recent anonymous activity, refreshed every 45 seconds (no websockets). */
export function RecentActivity({ initial }: { initial: Item[] }) {
  const [items, setItems] = useState(initial);
  useEffect(() => {
    const id = window.setInterval(async () => {
      try {
        const res = await fetch("/admin/analytics/activity", { cache: "no-store" });
        if (res.ok) setItems((await res.json()) as Item[]);
      } catch {
        /* keep showing the last result */
      }
    }, 45_000);
    return () => window.clearInterval(id);
  }, []);
  if (items.length === 0) return <p className="admin-muted">Nothing yet.</p>;
  return (
    <ol className="admin-activity">
      {items.map((it, i) => (
        <li key={`${it.at}-${i}`}>
          <time>{it.time}</time> — {it.text}
        </li>
      ))}
    </ol>
  );
}
