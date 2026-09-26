"use server";

import { redirect } from "next/navigation";
import { grantAdminSession, passwordMatches, revokeAdminSession } from "@/lib/analytics/adminAuth";

const DESTINATIONS = ["/admin/analytics", "/admin/guestbook"];

export async function login(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "");
  const to = DESTINATIONS.includes(next) ? next : "/admin/analytics";
  if (!passwordMatches(password)) {
    // Slow down guessing a little.
    await new Promise((r) => setTimeout(r, 800));
    redirect(`${to}?error=1`);
  }
  await grantAdminSession();
  redirect(to);
}

export async function logout() {
  await revokeAdminSession();
  redirect("/admin/analytics");
}
