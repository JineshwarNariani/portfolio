/** Guestbook validation shared by the form (client) and the API route (server). */
import { GUESTBOOK_LIMITS, type NewGuestbookEntry } from "./types";

export type ValidationErrors = Partial<Record<keyof NewGuestbookEntry, string>>;

export function normalizeUrl(raw?: string): string | undefined {
  const v = raw?.trim();
  if (!v) return undefined;
  const withProtocol = /^[a-z][a-z0-9+.-]*:/i.test(v) ? v : `https://${v}`;
  try {
    const u = new URL(withProtocol);
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : undefined;
  } catch {
    return undefined;
  }
}

export function validateEntry(input: NewGuestbookEntry): ValidationErrors {
  const errors: ValidationErrors = {};
  const message = input.message.trim();
  if (!message) errors.message = "Write a short note.";
  else if (message.length > GUESTBOOK_LIMITS.message) errors.message = `Keep it under ${GUESTBOOK_LIMITS.message} characters.`;
  if ((input.name?.trim().length ?? 0) > GUESTBOOK_LIMITS.name) errors.name = "That name is a little long.";
  if (input.url?.trim() && !normalizeUrl(input.url)) errors.url = "Use a web address (https://…).";
  if ((normalizeUrl(input.url)?.length ?? 0) > GUESTBOOK_LIMITS.url) errors.url = "That address is too long.";
  return errors;
}

export function cleanEntry(input: NewGuestbookEntry): NewGuestbookEntry {
  return {
    name: input.name?.trim().slice(0, GUESTBOOK_LIMITS.name) || undefined,
    message: input.message.trim().slice(0, GUESTBOOK_LIMITS.message),
    url: normalizeUrl(input.url),
  };
}
