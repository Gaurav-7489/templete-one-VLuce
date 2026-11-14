"use client";

import { useEffect, useRef, type ElementType, type ReactNode, type CSSProperties } from "react";

type Props = { as?: ElementType; className?: string; delay?: number; image?: boolean; children: ReactNode; style?: CSSProperties };

/** Reveals its children when scrolled into view. Content is visible without JavaScript and with reduced motion. */
export function Reveal({ as: Tag = "div", className = "", delay = 0, image = false, children, style }: Props) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries)
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag ref={ref} className={`${image ? "reveal-img" : "reveal"} ${className}`} style={{ ...style, ["--d" as string]: `${delay}s` }}>
      {children}
    </Tag>
  );
}
