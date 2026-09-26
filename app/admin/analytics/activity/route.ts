import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/analytics/adminAuth";
import { getRecentActivity } from "@/lib/analytics/dashboardQueries";
import { formatTime } from "@/lib/analytics/format";

export const dynamic = "force-dynamic";

/** Polled by the dashboard's Recent activity panel. Admin cookie required. */
export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const items = await getRecentActivity();
    return NextResponse.json(items.map((i) => ({ ...i, time: formatTime(i.at) })));
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 502 });
  }
}
