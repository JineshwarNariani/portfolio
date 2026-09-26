"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { useGuestbook } from "@/components/guestbook/GuestbookProvider";
import { interactiveFeathers } from "@/data/featherConfig";
import { profile } from "@/data/portfolioData";
import { trackLinkClicked } from "@/lib/analytics/analytics";
import { setIntent } from "@/lib/analytics/intent";

const PORTFOLIO = [{ href: "/about", label: "About" }, ...interactiveFeathers.map((f) => ({ href: f.href, label: f.label }))];

/**
 * Header utilities + INDEX: the conventional way in. Portfolio sections are
 * listed separately from utilities so the list stays calm.
 */
export function PeacockIndex() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { openForm } = useGuestbook();
  const listId = useId();
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      setOpen(false);
      button.current?.focus();
    };
    const onPointer = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey, true);
    window.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  const current = (href: string) => (pathname === href ? "page" : undefined);

  return (
    <div className="index" ref={root}>
      <Link
        className="index-util"
        href="/quick-view"
        aria-current={current("/quick-view")}
        onClick={() => setIntent("open", "top_nav")}
      >
        Quick View
      </Link>
      <a
        className="index-util index-resume"
        href={profile.resumeHref}
        target="_blank"
        rel="noreferrer"
        onClick={() => trackLinkClicked("resume", "top_nav")}
      >
        Resume <span aria-hidden="true">↗</span>
      </a>
      <button
        ref={button}
        type="button"
        className="index-toggle"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((o) => !o)}
      >
        Index
      </button>
      <nav id={listId} aria-label="Index" className="index-list" data-open={open || undefined} hidden={!open}>
        <p className="index-group">Portfolio</p>
        <ul>
          {PORTFOLIO.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={current(item.href)}
                onClick={() => {
                  setIntent("open", "index");
                  setOpen(false);
                }}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <p className="index-group">Other</p>
        <ul className="index-other">
          <li>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                openForm("index");
              }}
            >
              Leave a Feather
            </button>
          </li>
          <li>
            <Link
              href="/quick-view"
              aria-current={current("/quick-view")}
              onClick={() => {
                setIntent("open", "index");
                setOpen(false);
              }}
            >
              Quick View
            </Link>
          </li>
          <li>
            <a
              href={profile.resumeHref}
              target="_blank"
              rel="noreferrer"
              onClick={() => trackLinkClicked("resume", "index")}
            >
              Resume <span aria-hidden="true">↗</span>
            </a>
          </li>
        </ul>
      </nav>
    </div>
  );
}
