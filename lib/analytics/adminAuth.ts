import "server-only";

import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Password gate for /admin/analytics.
 *
 * ANALYTICS_ADMIN_SECRET — the password. If unset, the dashboard is disabled.
 * On success we set an httpOnly, SameSite=Strict cookie holding an expiry and
 * an HMAC of it (keyed by the secret) — nothing guessable, nothing client-readable.
 */
const COOKIE = "pk_admin";
const TTL_S = 12 * 60 * 60;

const secret = () => process.env.ANALYTICS_ADMIN_SECRET ?? "";
export const adminConfigured = () => secret().length >= 8;

const sign = (payload: string) => createHmac("sha256", secret()).update(`pk-admin-v1:${payload}`).digest("hex");

function safeEqual(a: string, b: string) {
  // Compare fixed-length digests so length differences leak nothing.
  const x = createHash("sha256").update(a).digest();
  const y = createHash("sha256").update(b).digest();
  return timingSafeEqual(x, y);
}

export function passwordMatches(candidate: string) {
  return adminConfigured() && safeEqual(candidate, secret());
}

export async function grantAdminSession() {
  const exp = Math.floor(Date.now() / 1000) + TTL_S;
  (await cookies()).set(COOKIE, `${exp}.${sign(String(exp))}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/admin",
    maxAge: TTL_S,
  });
}

export async function revokeAdminSession() {
  (await cookies()).delete({ name: COOKIE, path: "/admin" });
}

export async function isAdmin(): Promise<boolean> {
  if (!adminConfigured()) return false;
  const raw = (await cookies()).get(COOKIE)?.value ?? "";
  const [exp, sig] = raw.split(".");
  if (!exp || !sig || !/^\d+$/.test(exp) || Number(exp) < Date.now() / 1000) return false;
  return safeEqual(sig, sign(exp));
}
