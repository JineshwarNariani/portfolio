import { AdminNav } from "@/components/admin/AdminNav";
import { LoginForm } from "@/components/admin/LoginForm";
import { adminConfigured, isAdmin } from "@/lib/analytics/adminAuth";
import { formatDateTime } from "@/lib/analytics/format";
import { guestbookConfigured, listByStatus, type StoredEntry } from "@/lib/guestbook/supabaseServer";
import { approveNote, deleteNote, rejectNote } from "./actions";

export const dynamic = "force-dynamic";

/** Moderation: nothing a visitor writes appears on the site until it is approved here. */
export default async function GuestbookAdmin({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  if (!adminConfigured()) {
    return (
      <section className="admin-inner">
        <h1>Guestbook</h1>
        <p className="admin-muted">
          Admin is disabled. Set <code>ANALYTICS_ADMIN_SECRET</code> to enable it.
        </p>
      </section>
    );
  }
  if (!(await isAdmin())) return <LoginForm failed={params.error === "1"} next="/admin/guestbook" title="Guestbook" />;

  const configured = guestbookConfigured();
  let pending: StoredEntry[] | null = null;
  let approved: StoredEntry[] | null = null;
  if (configured) {
    try {
      [pending, approved] = await Promise.all([listByStatus("pending"), listByStatus("approved", 50)]);
    } catch {
      pending = approved = null;
    }
  }

  return (
    <section className="admin-inner">
      <AdminNav current="guestbook" />
      <h1>Guestbook</h1>
      <p className="admin-muted">Notes appear on the site only after you approve them.</p>

      {!configured && (
        <p className="admin-error">
          Supabase isn’t connected. Set <code>SUPABASE_URL</code> and <code>SUPABASE_SECRET_KEY</code>, and run{" "}
          <code>supabase/guestbook.sql</code> once.
        </p>
      )}
      {configured && pending === null && <p className="admin-error">Couldn’t reach Supabase. Check the URL, key and table.</p>}

      {pending && (
        <>
          <h2>Waiting for approval ({pending.length})</h2>
          {pending.length === 0 ? (
            <p className="admin-muted">Nothing waiting.</p>
          ) : (
            <ul className="admin-notes">
              {pending.map((n) => (
                <Note key={n.id} note={n}>
                  <ActionButton action={approveNote} id={n.id} label="Approve" primary />
                  <ActionButton action={rejectNote} id={n.id} label="Reject" />
                  <ActionButton action={deleteNote} id={n.id} label="Delete" />
                </Note>
              ))}
            </ul>
          )}
        </>
      )}

      {approved && (
        <>
          <h2>On the wind ({approved.length})</h2>
          {approved.length === 0 ? (
            <p className="admin-muted">No approved notes yet.</p>
          ) : (
            <ul className="admin-notes">
              {approved.map((n) => (
                <Note key={n.id} note={n}>
                  <ActionButton action={rejectNote} id={n.id} label="Take down" />
                  <ActionButton action={deleteNote} id={n.id} label="Delete" />
                </Note>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}

function Note({ note, children }: { note: StoredEntry; children: React.ReactNode }) {
  return (
    <li>
      <p className="admin-note-message">“{note.message}”</p>
      <p className="admin-muted">
        {note.name ? note.name : "Anonymous"} · {formatDateTime(note.createdAt)}
        {note.url && (
          <>
            {" "}
            ·{" "}
            <a href={note.url} target="_blank" rel="noopener noreferrer nofollow" className="admin-link">
              {note.url}
            </a>
          </>
        )}
      </p>
      <div className="admin-note-actions">{children}</div>
    </li>
  );
}

function ActionButton({
  action,
  id,
  label,
  primary = false,
}: {
  action: (formData: FormData) => Promise<void>;
  id: string;
  label: string;
  primary?: boolean;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <button type="submit" className={primary ? "admin-btn admin-btn-primary" : "admin-btn"}>
        {label}
      </button>
    </form>
  );
}
