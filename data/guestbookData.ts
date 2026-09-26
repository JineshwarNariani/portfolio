import type { GuestbookEntry } from "@/lib/guestbook/types";

/**
 * Notes that are always on the wind, so the page is never empty.
 * Written as the site owner — edit or remove freely. Never add invented visitor notes.
 */
export const seedEntries: GuestbookEntry[] = [
  {
    id: "seed-welcome",
    name: "Jineshwar",
    message: "Thanks for stopping by. If something here made you curious, leave a feather — it will drift here for the next visitor.",
    createdAt: "2026-09-25T00:00:00.000Z",
  },
  {
    id: "seed-how",
    name: "Jineshwar",
    message: "Every loose feather on this page is a note someone left. Catch one to read it.",
    createdAt: "2026-09-25T00:00:00.000Z",
  },
];
