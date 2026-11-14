import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

export const Arrow = (p: P) => (
  <svg className="arrow" viewBox="0 0 22 10" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true" {...p}>
    <path d="M0 5h21M16.5 0.5 21 5l-4.5 4.5" />
  </svg>
);

export const Heart = (p: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true" {...p}>
    <path d="M12 20.5s-7.5-4.6-9.2-9.4C1.6 7.6 3.9 4 7.4 4c2 0 3.5 1.1 4.6 2.7C13.1 5.1 14.6 4 16.6 4c3.5 0 5.8 3.6 4.6 7.1-1.7 4.8-9.2 9.4-9.2 9.4Z" />
  </svg>
);

export const Search = (p: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true" {...p}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="m20 20-4.6-4.6" />
  </svg>
);

export const WhatsApp = (p: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91A9.84 9.84 0 0 0 12.04 2Zm0 18.15h-.01a8.22 8.22 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.24 8.24 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.8-.23-.09-.39-.13-.56.12-.16.25-.64.8-.78.97-.14.16-.29.18-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.16.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.42h-.48a.92.92 0 0 0-.66.31c-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.11-.23-.17-.48-.29Z" />
  </svg>
);

export const Chevron = ({ dir = "right", ...p }: P & { dir?: "left" | "right" }) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true" {...p}>
    <path d={dir === "right" ? "m9 5 7 7-7 7" : "m15 5-7 7 7 7"} />
  </svg>
);

/** Minimal line silhouette used in image fallbacks. Generic — not any manufacturer's design. */
export const CarLine = (p: P) => (
  <svg viewBox="0 0 400 120" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true" {...p}>
    <path d="M14 88c0-9 4-14 14-16l52-9c18-15 46-30 92-32 46-2 86 10 112 30l60 10c26 4 38 10 42 17v9c0 4-3 6-7 6h-24" />
    <path d="M114 93h178M48 93H22c-5 0-8-2-8-5" />
    <circle cx="84" cy="92" r="20" />
    <circle cx="322" cy="92" r="20" />
    <path d="M96 62c26-18 52-26 84-27 34-1 62 6 84 26" opacity=".6" />
  </svg>
);

const line = { fill: "none", stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export const MenuIcon = (p: P) => (
  <svg viewBox="0 0 24 24" {...line} strokeWidth={2} aria-hidden="true" {...p}><path d="M4 7h16M4 12h16M4 17h16" /></svg>
);
export const Phone = (p: P) => (
  <svg viewBox="0 0 24 24" {...line} aria-hidden="true" {...p}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1Z" /><path d="M15 4a5 5 0 0 1 5 5M15 7.5a1.5 1.5 0 0 1 1.5 1.5" /></svg>
);
export const ArrowUpRight = (p: P) => (
  <svg viewBox="0 0 24 24" width="18" height="18" {...line} aria-hidden="true" {...p}><path d="M7 17 17 7M9 7h8v8" /></svg>
);
export const Odometer = (p: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}><path d="M20 4 4 11l7 2 2 7 7-16Z" /></svg>
);
export const FuelPump = (p: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}><path d="M5 4h9v16H5V4Zm2 2v5h5V6H7Zm9 2 3 3v7a1.5 1.5 0 0 1-3 0v-4h-1v-2h2.5v6h.5v-6.2L15.4 9.4 16 8Z" /></svg>
);
export const Plate = (p: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}><path d="M6 4h12v16l-6-3-6 3V4Zm3 3v2h6V7H9Z" /></svg>
);

/** Small round glyphs for the header category tabs. Generic shapes, not any brand's marks. */
export const TabIcon = ({ name, ...p }: P & { name: string }) => {
  const d: Record<string, React.ReactNode> = {
    all: <><circle cx="12" cy="12" r="9" /><path d="M8 8h3v3H8zM13 8h3v3h-3zM8 13h3v3H8zM13 13h3v3h-3z" /></>,
    "luxury-sedans": <><circle cx="12" cy="12" r="9" /><path d="M6.5 13.5 8 10h8l1.5 3.5M6.5 13.5h11v2h-11z" /></>,
    suvs: <><circle cx="12" cy="12" r="9" /><path d="M6.5 15v-3.5l2-2.5h6l3 2.5V15zM9 15v1M15 15v1" /></>,
    performance: <><circle cx="12" cy="12" r="9" /><path d="M12 12 16 8M7.5 14.5a5 5 0 0 1 9 0" /></>,
    sports: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="2.5" /><path d="M12 3v6.5M4 15l5.7-2M20 15l-5.7-2" /></>,
    electric: <><circle cx="12" cy="12" r="9" /><path d="M13 6.5 9 13h3l-1 4.5 4-6.5h-3z" /></>,
    "premium-hatchbacks": <><circle cx="12" cy="12" r="9" /><path d="M7 14.5v-2l2.5-3H14l3 3v2zM9.5 14.5v1M14.5 14.5v1" /></>,
  };
  return <svg viewBox="0 0 24 24" {...line} strokeWidth={1.2} aria-hidden="true" {...p}>{d[name] ?? d.all}</svg>;
};
