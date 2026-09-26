"use client";

import { useState } from "react";
import { TrackedLink } from "@/components/analytics/TrackedLink";
import { profile } from "@/data/portfolioData";
import { PanelShell } from "./PanelShell";

export function AboutPanel({ onReturn }: { onReturn: () => void }) {
  const [more, setMore] = useState(false);
  return (
    <PanelShell label="About" onReturn={onReturn} variant="about">
      <p className="about-name">{profile.name}</p>
      <p className="about-roles">{profile.roles.join(" · ")}</p>
      <p className="about-summary">{profile.summary}</p>
      <ul className="panel-links">
        {profile.links.map((l) => (
          <li key={l.label}>
            <TrackedLink href={l.href} label={l.label} location="about" />
          </li>
        ))}
      </ul>

      <button
        type="button"
        className="about-more-toggle"
        aria-expanded={more}
        aria-controls="about-more"
        onClick={() => setMore((m) => !m)}
      >
        {more ? "Read less" : "Read more…"}
      </button>
      <div id="about-more" className="about-more" hidden={!more}>
        {profile.about.map((para, i) => (
          <p key={i} className="about-para">
            {para}
          </p>
        ))}
        <p className="about-edu">
          <span className="about-edu-school">{profile.education.school}</span>
          <span>{profile.education.degree}</span>
          <span className="about-edu-detail">{profile.education.detail}</span>
          {profile.education.honours.length > 0 && (
            <span className="about-edu-detail">Scholarships: {profile.education.honours.join(" · ")}</span>
          )}
        </p>
      </div>
    </PanelShell>
  );
}
