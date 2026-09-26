"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { motion } from "motion/react";
import { animationConfig } from "@/lib/animationConfig";

interface PanelShellProps {
  label: string;
  micro?: string;
  onReturn: () => void;
  variant?: "section" | "about";
  children: ReactNode;
}

/**
 * Editorial chrome for every open section: return control, small gold label,
 * thin gold rule, then the content. Focus moves to the label when it opens.
 */
export function PanelShell({ label, micro, onReturn, variant = "section", children }: PanelShellProps) {
  const heading = useRef<HTMLHeadingElement>(null);
  const c = animationConfig.content;

  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, []);

  return (
    <motion.section
      className={`panel panel-${variant}`}
      aria-labelledby="panel-heading"
      initial={{ opacity: 0, y: c.shift }}
      animate={{ opacity: 1, y: 0, transition: { duration: c.fadeIn, ease: [0.22, 1, 0.36, 1] } }}
      exit={{ opacity: 0, y: c.shift / 2, transition: { duration: c.fadeOut, ease: "easeIn" } }}
    >
      <div className="panel-inner">
        <button type="button" className="panel-return" onClick={onReturn}>
          <span aria-hidden="true">←</span> Return
        </button>
        <h2 id="panel-heading" ref={heading} tabIndex={-1} className="panel-label">
          {label}
        </h2>
        {micro && <p className="panel-micro">{micro}</p>}
        <span className="panel-rule" aria-hidden="true" />
        {children}
      </div>
    </motion.section>
  );
}
