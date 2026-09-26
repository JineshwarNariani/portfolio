"use client";

import { TrackedLink } from "@/components/analytics/TrackedLink";
import { useGuestbook } from "@/components/guestbook/GuestbookProvider";
import { featherById, type FeatherId } from "@/data/featherConfig";
import { sections } from "@/data/portfolioData";
import { PanelShell } from "./PanelShell";

/** Content for one feather's section — rendered from data/portfolioData.ts. */
export function SectionPanel({ id, onReturn }: { id: FeatherId; onReturn: () => void }) {
  const spec = featherById[id];
  const content = sections[id];
  const { openForm } = useGuestbook();
  return (
    <PanelShell label={spec.label} micro={spec.microLabel} onReturn={onReturn}>
      {content.intro && <p className="panel-intro">{content.intro}</p>}
      {content.entries.length > 0 && (
        <ul className="entries">
          {content.entries.map((e, i) => (
            <li key={i} className="entry" data-placeholder={e.placeholder || undefined}>
              <h3 className="entry-title">{e.title}</h3>
              {e.meta && <p className="entry-meta">{e.meta}</p>}
              {e.body && <p className="entry-body">{e.body}</p>}
              {e.tags && <p className="entry-tags">{e.tags.join(" • ")}</p>}
              {e.links && (
                <p className="entry-links">
                  {e.links.map((l) => (
                    <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer">
                      {l.label} <span aria-hidden="true">↗</span>
                    </a>
                  ))}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
      {content.links && (
        <ul className="panel-links">
          {content.links.map((l) => (
            <li key={l.label}>
              <TrackedLink href={l.href} label={l.label} location="contact" />
            </li>
          ))}
        </ul>
      )}
      {content.note && <p className="panel-note">{content.note}</p>}
      {id === "contact" && (
        <p className="panel-leave">
          Or, more quietly —{" "}
          <button type="button" onClick={() => openForm("contact")}>
            leave a feather
          </button>
          .
        </p>
      )}
    </PanelShell>
  );
}
