export interface GuestbookEntry {
  id: string;
  name?: string;
  message: string;
  /** LinkedIn or personal site — http(s) only. */
  url?: string;
  /** ISO timestamp. */
  createdAt: string;
}

export type NewGuestbookEntry = Pick<GuestbookEntry, "name" | "message" | "url">;

export const GUESTBOOK_LIMITS = {
  name: 40,
  message: 240,
  url: 200,
} as const;
