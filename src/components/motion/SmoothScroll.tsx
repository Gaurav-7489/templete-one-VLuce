"use client";

import Lenis from "lenis";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

const LenisContext = createContext<Lenis | null>(null);
export const useLenis = () => useContext(LenisContext);

/**
 * Inertial smooth scrolling (Lenis). Off for reduced-motion users and touch devices keep native
 * momentum. Overlays mark themselves with data-lenis-prevent so they scroll normally, and any
 * element that locks the page (html overflow hidden) pauses Lenis automatically.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const pathname = usePathname();
  const first = useRef(true);

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const l = new Lenis({ duration: 1.15, easing: (t) => 1 - Math.pow(1 - t, 4), smoothWheel: true, wheelMultiplier: 0.9 });
    document.documentElement.classList.add("lenis-on");
    let raf = requestAnimationFrame(function loop(t) {
      l.raf(t);
      raf = requestAnimationFrame(loop);
    });
    // Pause while a modal, menu or drawer locks the page.
    const mo = new MutationObserver(() => (document.documentElement.style.overflow === "hidden" ? l.stop() : l.start()));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["style"] });
    setLenis(l);
    return () => {
      cancelAnimationFrame(raf);
      mo.disconnect();
      l.destroy();
      document.documentElement.classList.remove("lenis-on");
    };
  }, []);

  // New page: start at the top (or at the #hash target).
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const hash = location.hash ? document.querySelector(location.hash) : null;
    if (lenis) lenis.scrollTo((hash as HTMLElement) ?? 0, { immediate: !hash, offset: -140 });
  }, [pathname, lenis]);

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}
