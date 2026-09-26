import "server-only";

import { createHmac } from "node:crypto";
import type { GuestbookEntry } from "./types";

/**
 * Server-only access to the Supabase guestbook table over its REST API.
 * The secret key bypasses Row Level Security, so it must never reach the
 * browser — it is only read here.
 *
 * SUPABASE_URL          e.g. https://abcd1234.supabase.co
 * SUPABASE_SECRET_KEY   Settings → API Keys → Secret key (sb_secret_…);
 *                       a legacy service_role key also works.
 */
const url = (process.env.SUPABASE_URL ?? "").replace(/\/$/, "");
const key = process.env.SUPABASE_SECRET_KEY ?? "";

// https for hosted projects; http://localhost / 127.0.0.1 for the Supabase CLI's local stack.
export const guestbookConfigured = () => /^(https:\/\/|http:\/\/(localhost|127\.0\.0\.1)[:/])/.test(url) && key !== "";

export type Status = "pending" | "approved" | "rejected";
export interface StoredEntry extends GuestbookEntry {
  status: Status;
}

const TABLE = `${url}/rest/v1/guestbook_entries`;
const PUBLIC_COLUMNS = "id,name,message,url,created_at,status";

function headers(extra: Record<string, string> = {}) {
  const h: Record<string, string> = { apikey: key, "Content-Type": "application/json", ...extra };
  // Legacy JWT keys also need the Authorization header; new sb_secret_ keys must not use it.
  if (key.startsWith("eyJ")) h.Authorization = `Bearer ${key}`;
  return h;
}

async function rest(path: string, init: RequestInit & { headers?: Record<string, string> } = {}) {
  const res = await fetch(`${TABLE}${path}`, { ...init, headers: headers(init.headers), cache: "no-store" });
  if (!res.ok) throw new Error(`Supabase request failed (${res.status})`);
  return res.status === 204 ? null : res.json();
}

type Row = { id: string; name: string | null; message: string; url: string | null; created_at: string; status: Status };
const toEntry = (r: Row): StoredEntry => ({
  id: r.id,
  name: r.name ?? undefined,
  message: r.message,
  url: r.url ?? undefined,
  createdAt: r.created_at,
  status: r.status,
});

/** Only approved notes, newest first — the only thing the public API serves. */
export async function listApproved(limit = 60): Promise<GuestbookEntry[]> {
  const rows = (await rest(`?select=${PUBLIC_COLUMNS}&status=eq.approved&order=created_at.desc&limit=${limit}`)) as Row[];
  return rows.map((r) => ({
    id: r.id,
    name: r.name ?? undefined,
    message: r.message,
    url: r.url ?? undefined,
    createdAt: r.created_at,
  }));
}

export async function listByStatus(status: Status, limit = 100): Promise<StoredEntry[]> {
  const rows = (await rest(`?select=${PUBLIC_COLUMNS}&status=eq.${status}&order=created_at.desc&limit=${limit}`)) as Row[];
  return rows.map(toEntry);
}

export async function insertPending(entry: { name?: string; message: string; url?: string }, submitterHash: string) {
  const rows = (await rest("", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      name: entry.name ?? null,
      message: entry.message,
      url: entry.url ?? null,
      submitter_hash: submitterHash,
    }),
  })) as Row[];
  return toEntry(rows[0]);
}

/** Notes this submitter left since `sinceIso` (for rate limiting). */
export async function countRecentBySubmitter(submitterHash: string, sinceIso: string) {
  const rows = (await rest(
    `?select=id&submitter_hash=eq.${encodeURIComponent(submitterHash)}&created_at=gte.${encodeURIComponent(sinceIso)}&limit=20`,
  )) as unknown[];
  return rows.length;
}

export async function countPending() {
  const rows = (await rest(`?select=id&status=eq.pending&limit=501`)) as unknown[];
  return rows.length;
}

const isUuid = (v: string) => /^[0-9a-f-]{36}$/i.test(v);

/** Approve or reject; the submitter hash is erased either way. */
export async function moderate(id: string, status: "approved" | "rejected") {
  if (!isUuid(id)) return;
  await rest(`?id=eq.${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status, moderated_at: new Date().toISOString(), submitter_hash: null }),
  });
}

export async function remove(id: string) {
  if (!isUuid(id)) return;
  await rest(`?id=eq.${id}`, { method: "DELETE" });
}

/** One-way, keyed hash of the network address — not reversible without the server secret. */
export function hashSubmitter(ip: string) {
  return createHmac("sha256", key || "guestbook").update(`guestbook-v1:${ip}`).digest("hex");
}
