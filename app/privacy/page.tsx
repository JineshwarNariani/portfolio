import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy — Jineshwar Nariani",
  description: "How jineshwarnariani.com handles analytics and guestbook notes: anonymous, no referrers, no IP addresses stored.",
  alternates: { canonical: "/privacy" },
};

/** Plain-language note about analytics. Keep in sync with docs/analytics-events.md. */
export default function Privacy() {
  return (
    <main className="plain-page">
      <div className="plain-inner">
        <Link href="/" className="qv-back">
          <span aria-hidden="true">←</span> Back to Peacock
        </Link>
        <h1>Privacy</h1>
        <p>
          This site uses privacy-conscious analytics (PostHog) to understand how visitors interact with the portfolio.
          Analytics record anonymous interaction events — which sections are opened and for how long, session duration,
          whether features like Quick View, the flute or the guestbook are used, and clicks on the résumé and profile
          links.
        </p>
        <p>
          Analytics also records your approximate location — city and country — which PostHog estimates from your
          network address before discarding the address itself. It does not record where you came from (no referrer or
          campaign tracking), your IP address, session replays, or the text you type. Guestbook notes, names and links are never sent to analytics — only facts like “a note
          was left” and its length.
        </p>
        <p>
          To recognise a return visit, the browser keeps an anonymous random identifier and a visit counter in local
          storage. No cookies are set for analytics, and nothing is linked to your name or email.
        </p>
        <p>
          Notes you leave with “Leave a feather” are stored in the site’s database (Supabase) and appear on the page only
          after they have been read and approved. To prevent spam, a scrambled, one-way code derived from your network
          address is kept with a note while it waits for approval, and erased once it has been approved or rejected.
          Want a note removed? Get in touch through the Contact feather.
        </p>
      </div>
    </main>
  );
}
