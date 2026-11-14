"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

/** A short opening curtain with the wordmark, shown once per visit. Skipped for reduced motion. */
export function Intro({ wordmark, descriptor }: { wordmark: string; descriptor: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    try {
      if (sessionStorage.getItem("vluce:intro") || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      sessionStorage.setItem("vluce:intro", "1");
    } catch {
      return;
    }
    setShow(true);
    const t = setTimeout(() => setShow(false), 1700);
    return () => clearTimeout(t);
  }, []);
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="intro"
          initial={{ clipPath: "inset(0 0 0 0)" }}
          exit={{ clipPath: "inset(0 0 100% 0)" }}
          transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
          onClick={() => setShow(false)}
          aria-hidden="true"
        >
          <motion.span className="intro__crest" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}>
            <svg viewBox="0 0 64 64" width="56" height="56" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M14 18l18 32 18-32" /><path d="M8 18h12M44 18h12" /><circle cx="32" cy="10" r="2.5" /></svg>
          </motion.span>
          <motion.span className="intro__word" initial={{ letterSpacing: "0.9em", opacity: 0 }} animate={{ letterSpacing: "0.42em", opacity: 1 }} transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}>
            {wordmark}
          </motion.span>
          <motion.span className="intro__desc" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.55 }}>
            {descriptor}
          </motion.span>
          <motion.span className="intro__line" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1.3, ease: [0.65, 0, 0.35, 1], delay: 0.2 }} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
