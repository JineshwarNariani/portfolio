"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useDialogKeys } from "@/hooks/useDialogKeys";
import { GUESTBOOK_LIMITS } from "@/lib/guestbook/types";
import { trackGuestbookFailed, trackGuestbookSubmitted } from "@/lib/analytics/analytics";
import { validateEntry, type ValidationErrors } from "@/services/guestbookService";
import { useGuestbook } from "./GuestbookProvider";

type Phase = "editing" | "sending" | "sent";

/** "Leave a feather": a short note that becomes a loose feather on the wind. */
export function LeaveFeatherForm() {
  const { formOpen, closeForm, create } = useGuestbook();
  const ref = useRef<HTMLDivElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [url, setUrl] = useState("");
  // Honeypot: hidden from people, irresistible to bots. Any value = silently discarded.
  const [website, setWebsite] = useState("");
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [phase, setPhase] = useState<Phase>("editing");

  useDialogKeys(ref, formOpen, closeForm);

  useEffect(() => {
    if (formOpen) messageRef.current?.focus({ preventScroll: true });
  }, [formOpen]);

  if (!formOpen) return null;

  const reset = () => {
    setName("");
    setMessage("");
    setUrl("");
    setWebsite("");
    setErrors({});
    setPhase("editing");
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const input = { name, message, url };
    const found = validateEntry(input);
    setErrors(found);
    if (Object.keys(found).length) return;
    setPhase("sending");
    try {
      const result = await create({ ...input, website });
      trackGuestbookSubmitted({ id: result.id, message: result.submitted.message, name: result.submitted.name, url: result.submitted.url });
      // The note is pending: it joins the wind only after it has been approved.
      setPhase("sent");
      setTimeout(() => {
        closeForm();
        reset();
      }, 3200);
    } catch (err) {
      trackGuestbookFailed(err, message.trim().length);
      setErrors({ message: err instanceof Error ? err.message : "Something went wrong. Try again." });
      setPhase("editing");
    }
  };

  const remaining = GUESTBOOK_LIMITS.message - message.length;

  return (
    <div className="leave-veil" onPointerDown={(e) => e.target === e.currentTarget && closeForm()}>
      <div ref={ref} className="leave-sheet" role="dialog" aria-modal="true" aria-labelledby="leave-title">
        <span className="guest-note-rule" aria-hidden="true" />
        <h2 id="leave-title" className="leave-title">
          Leave a feather
        </h2>
        {phase === "sent" ? (
          <p className="leave-sent" role="status">
            Thank you. Your feather will join the wind once it has been read.
          </p>
        ) : (
          <form onSubmit={submit} noValidate>
            <p className="leave-intro">
              A short note. Once it has been read, it will drift here for the next visitor to catch.
            </p>
            <label className="leave-honeypot" aria-hidden="true">
              Website
              <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
            </label>
            <label className="leave-field">
              <span>Message</span>
              <textarea
                ref={messageRef}
                value={message}
                maxLength={GUESTBOOK_LIMITS.message}
                rows={4}
                required
                aria-invalid={!!errors.message}
                aria-describedby="leave-count"
                onChange={(e) => setMessage(e.target.value)}
              />
              <span id="leave-count" className="leave-count" aria-live="polite">
                {errors.message ?? `${remaining} characters left`}
              </span>
            </label>
            <label className="leave-field">
              <span>
                Name <em>optional</em>
              </span>
              <input value={name} maxLength={GUESTBOOK_LIMITS.name} autoComplete="name" onChange={(e) => setName(e.target.value)} />
              {errors.name && <span className="leave-count">{errors.name}</span>}
            </label>
            <label className="leave-field">
              <span>
                LinkedIn or website <em>optional</em>
              </span>
              <input
                value={url}
                inputMode="url"
                maxLength={GUESTBOOK_LIMITS.url}
                aria-invalid={!!errors.url}
                onChange={(e) => setUrl(e.target.value)}
              />
              {errors.url && <span className="leave-count">{errors.url}</span>}
            </label>
            <div className="leave-actions">
              <button type="submit" className="leave-submit" disabled={phase === "sending"}>
                Leave feather
              </button>
              <button type="button" className="leave-cancel" onClick={closeForm}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
