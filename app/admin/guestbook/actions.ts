"use server";

import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/analytics/adminAuth";
import { moderate, remove } from "@/lib/guestbook/supabaseServer";

/** Every action re-checks the admin session on the server — the page being hidden is not protection. */
async function guard() {
  if (!(await isAdmin())) throw new Error("Not authorised");
}

export async function approveNote(formData: FormData) {
  await guard();
  await moderate(String(formData.get("id") ?? ""), "approved");
  revalidatePath("/admin/guestbook");
}

export async function rejectNote(formData: FormData) {
  await guard();
  await moderate(String(formData.get("id") ?? ""), "rejected");
  revalidatePath("/admin/guestbook");
}

export async function deleteNote(formData: FormData) {
  await guard();
  await remove(String(formData.get("id") ?? ""));
  revalidatePath("/admin/guestbook");
}
