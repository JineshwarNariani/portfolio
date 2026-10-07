import Link from "next/link";
import { featherById, interactiveFeathers, type FeatherId } from "@/data/featherConfig";
import { profile, sections, type Entry } from "@/data/portfolioData";
import { pageDescriptions } from "@/data/seo";
import { SITE_URL } from "@/lib/site";

/**
 * A plain-text edition of each page, rendered on the server.
 *
 * The peacock reveals content only after its animation runs in the browser, so
 * without this every route would reach search engines (and no-JS readers) as the
 * same empty shell. It's visually hidden — sighted visitors get the same text
 * from the feathers — and carries the page's single <h1>.
 */
export function SeoDocument({ page }: { page: FeatherId | "home" | "about" }) {
  return (
    <article className="seo-doc">
      {page === "home" ? <Home /> : page === "about" ? <About /> : <Section id={page} />}
      <nav aria-label="Pages">
        <Link href="/">Jineshwar Nariani</Link> · <Link href="/about">About</Link> ·{" "}
        {interactiveFeathers.map((f) => (
          <span key={f.id}>
            <Link href={f.href}>{f.label}</Link> ·{" "}
          </span>
        ))}
        <Link href="/quick-view">Quick View</Link>
      </nav>
    </article>
  );
}

function Home() {
  return (
    <>
      <h1>Jineshwar Nariani — {profile.roles.join(", ")}</h1>
      <p>{profile.summary}</p>
      <ul>
        <li>
          <Link href="/about">About Jineshwar Nariani</Link> — {pageDescriptions.about}
        </li>
        {interactiveFeathers.map((f) => (
          <li key={f.id}>
            <Link href={f.href}>{f.label}</Link> — {pageDescriptions[f.id]}
          </li>
        ))}
        <li>
          <Link href="/quick-view">Quick View</Link> — {pageDescriptions.quickView}
        </li>
      </ul>
      <PersonJsonLd />
    </>
  );
}

function About() {
  return (
    <>
      <h1>About Jineshwar Nariani</h1>
      <p>{profile.summary}</p>
      {profile.about.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
      <p>
        {profile.education.school} — {profile.education.degree}. {profile.education.detail}. Scholarships:{" "}
        {profile.education.honours.join(", ")}.
      </p>
      <Links links={profile.links} />
    </>
  );
}

function Section({ id }: { id: FeatherId }) {
  const s = sections[id];
  return (
    <>
      <h1>{featherById[id].label} — Jineshwar Nariani</h1>
      {s.intro && <p>{s.intro}</p>}
      {s.entries
        .filter((e) => !e.placeholder)
        .map((e) => (
          <EntryBlock key={e.title} e={e} />
        ))}
      {s.note && <p>{s.note}</p>}
      {s.links && <Links links={s.links} />}
    </>
  );
}

function EntryBlock({ e }: { e: Entry }) {
  return (
    <section>
      <h2>{e.title}</h2>
      {e.meta && <p>{e.meta}</p>}
      {e.body && <p>{e.body}</p>}
      {e.tags && <p>{e.tags.join(", ")}</p>}
      {e.links && <Links links={e.links} />}
    </section>
  );
}

function Links({ links }: { links: { label: string; href: string }[] }) {
  return (
    <ul>
      {links.map((l) => (
        <li key={l.label}>
          <a href={l.href}>{l.label}</a>
        </li>
      ))}
    </ul>
  );
}

/** Structured data so search engines know who the site is about. */
function PersonJsonLd() {
  const sameAs = profile.links
    .filter((l) => /^https:\/\/(www\.)?(linkedin|github|x|devpost)\./.test(l.href))
    .map((l) => l.href);
  const data = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    url: SITE_URL,
    jobTitle: "AI Engineer",
    description: profile.summary,
    alumniOf: { "@type": "CollegeOrUniversity", name: profile.education.school },
    knowsAbout: ["Artificial intelligence", "Multi-agent systems", "Large language models", "Reinforcement learning", "Machine learning"],
    sameAs,
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
