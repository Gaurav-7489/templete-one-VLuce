"use client";

import { motion, useReducedMotion } from "motion/react";
import { Children, type ReactNode } from "react";

/** Children rise and fade in one after another as the group scrolls into view. */
export function Stagger({ children, className = "", step = 0.07 }: { children: ReactNode; className?: string; step?: number }) {
  const reduce = useReducedMotion();
  return (
    <div className={className}>
      {Children.map(children, (child, i) =>
        reduce ? (
          child
        ) : (
          <motion.div
            className="stagger-item"
            initial={{ opacity: 0, y: 40, scale: 0.985 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "0px 0px -60px 0px" }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: (i % 3) * step }}
          >
            {child}
          </motion.div>
        ),
      )}
    </div>
  );
}
