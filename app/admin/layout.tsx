import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Analytics — private",
  robots: { index: false, follow: false },
};

/** Private admin area: a plain scrolling document (no peacock, no analytics). */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="admin">{children}</div>;
}
