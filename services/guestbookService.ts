/**
 * Guestbook persistence behind a small interface. The UI only ever talks to
 * `guestbookService`.
 *
 * Current implementation: the site's own API (/api/guestbook), backed by
 * Supabase. New notes are stored as "pending" and only drift on the page after
 * they are approved in /admin/guestbook.
 */
import type { GuestbookEntry, NewGuestbookEntry } from "@/lib/guestbook/types";
import { cleanEntry, validateEntry } from "@/lib/guestbook/validation";

export { normalizeUrl, validateEntry, type ValidationErrors } from "@/lib/guestbook/validation";

export interface CreateResult {
  id: string;
  /** "pending" until approved by the site owner. */
  status: "pending" | "approved";
  /** What was submitted, cleaned — used locally only (e.g. analytics metadata). */
  submitted: NewGuestbookEntry;
}

export interface GuestbookService {
  /** Approved notes, newest first. */
  getEntries(): Promise<GuestbookEntry[]>;
  createEntry(input: NewGuestbookEntry & { website?: string }): Promise<CreateResult>;
}

export class GuestbookError extends Error {
  constructor(
    message: string,
    readonly category: "validation" | "rate_limited" | "unavailable",
  ) {
    super(message);
  }
}

export function createApiGuestbookService(endpoint = "/api/guestbook"): GuestbookService {
  return {
    async getEntries() {
      try {
        const res = await fetch(endpoint);
        if (!res.ok) return [];
        const data = (await res.json()) as { entries?: GuestbookEntry[] };
        return (data.entries ?? []).filter((e) => typeof e?.id === "string" && typeof e?.message === "string");
      } catch {
        return [];
      }
    },
    async createEntry(input) {
      const errors = validateEntry(input);
      if (Object.keys(errors).length) throw new GuestbookError(Object.values(errors)[0]!, "validation");
      const submitted = cleanEntry(input);
      let res: Response;
      try {
        res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...submitted, website: input.website ?? "" }),
        });
      } catch {
        throw new GuestbookError("Couldn't reach the guestbook. Check your connection and try again.", "unavailable");
      }
      const data = (await res.json().catch(() => ({}))) as { id?: string; status?: string; error?: string };
      if (!res.ok || !data.id) {
        const category = res.status === 400 ? "validation" : res.status === 429 ? "rate_limited" : "unavailable";
        throw new GuestbookError(data.error ?? "Something went wrong. Try again.", category);
      }
      return { id: data.id, status: data.status === "approved" ? "approved" : "pending", submitted };
    },
  };
}

/** The one instance the app uses. Replace this line to change backends. */
export const guestbookService: GuestbookService = createApiGuestbookService();
