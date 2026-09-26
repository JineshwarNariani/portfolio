import Link from "next/link";
import { logout } from "@/app/admin/analytics/actions";

/** Shared header for the private admin pages. */
export function AdminNav({ current }: { current: "analytics" | "guestbook" }) {
  return (
    <nav className="admin-nav" aria-label="Admin">
      <Link href="/admin/analytics" aria-current={current === "analytics" ? "page" : undefined}>
        Analytics
      </Link>
      <Link href="/admin/guestbook" aria-current={current === "guestbook" ? "page" : undefined}>
        Guestbook
      </Link>
      <form action={logout}>
        <button type="submit" className="admin-link">
          Sign out
        </button>
      </form>
    </nav>
  );
}
