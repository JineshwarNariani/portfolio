import { NextResponse, type NextRequest } from "next/server";
import { seedEntries } from "@/data/guestbookData";
import {
  countPending,
  countRecentBySubmitter,
  guestbookConfigured,
  hashSubmitter,
  insertPending,
  listApproved,
} from "@/lib/guestbook/supabaseServer";
import { cleanEntry, validateEntry } from "@/lib/guestbook/validation";

export const dynamic = "force-dynamic";

/** Per-visitor and global limits on new notes. */
const PER_HOUR = 3;
const MAX_PENDING = 200;

/** GET — approved notes (plus the site's own seed notes). Never pending or rejected ones. */
export async function GET() {
  let approved: Awaited<ReturnType<typeof listApproved>> = [];
  if (guestbookConfigured()) {
    try {
      approved = await listApproved();
    } catch {
      /* database unreachable: the seed notes still drift */
    }
  }
  return NextResponse.json(
    { entries: [...approved, ...seedEntries] },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
  );
}

/** POST — a new note. Stored as 'pending'; it appears only after approval. */
export async function POST(req: NextRequest) {
  if (!guestbookConfigured()) {
    return NextResponse.json({ error: "The guestbook isn't accepting notes yet." }, { status: 503 });
  }
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Something went wrong. Try again." }, { status: 400 });
  }

  // Honeypot: a hidden field real visitors never fill. Pretend success.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ id: crypto.randomUUID(), status: "pending" }, { status: 201 });
  }

  const input = {
    name: typeof body.name === "string" ? body.name : undefined,
    message: typeof body.message === "string" ? body.message : "",
    url: typeof body.url === "string" ? body.url : undefined,
  };
  const errors = validateEntry(input);
  if (Object.keys(errors).length) {
    return NextResponse.json({ error: Object.values(errors)[0] }, { status: 400 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  const submitter = hashSubmitter(ip);
  try {
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    if ((await countRecentBySubmitter(submitter, hourAgo)) >= PER_HOUR || (await countPending()) >= MAX_PENDING) {
      return NextResponse.json({ error: "Lots of feathers already — please try again a little later." }, { status: 429 });
    }
    const entry = await insertPending(cleanEntry(input), submitter);
    return NextResponse.json({ id: entry.id, status: "pending" }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "The guestbook is resting. Please try again later." }, { status: 502 });
  }
}
