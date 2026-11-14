import type { Lifestyle } from "@/lib/types";

/**
 * Original line illustrations used across menus and filters, so customers can
 * scan by shape rather than read labels. Drawn for VLuce; generic body styles only.
 */
const wheels = (a: number, b: number) => (
  <>
    <circle cx={a} cy="38" r="7" />
    <circle cx={a} cy="38" r="2.6" />
    <circle cx={b} cy="38" r="7" />
    <circle cx={b} cy="38" r="2.6" />
  </>
);

const bodies: Record<string, React.ReactNode> = {
  sedan: (
    <>
      <path d="M8 38h7m14 0h54m14 0h9c3 0 4-2 4-4v-4c0-3-2-4-6-5l-14-3-12-8c-3-2-6-3-10-3H48c-4 0-7 1-10 3l-10 8-14 2c-4 1-6 3-6 6v4c0 2 0 4 0 4Z" />
      <path d="M33 22h59M44 14v8M66 13v9" />
      {wheels(22, 90)}
    </>
  ),
  suv: (
    <>
      <path d="M8 38h7m14 0h54m14 0h9c2 0 4-1 4-3v-8c0-3-2-5-5-6l-10-2-9-9c-2-2-4-3-7-3H34c-3 0-5 1-7 3l-8 9-7 1c-3 1-4 3-4 6v12Z" />
      <path d="M19 19h77M40 10v9M62 10v9M84 10l-1 9" />
      <path d="M30 6h46" />
      {wheels(22, 90)}
    </>
  ),
  coupe: (
    <>
      <path d="M8 38h7m14 0h54m14 0h10c3 0 4-2 4-4v-3c0-3-2-5-6-6l-16-3-14-8c-3-2-6-2-9-2H50c-5 0-9 2-13 4l-11 7-13 2c-4 1-5 3-5 6v3c0 2 0 4 0 4Z" />
      <path d="M33 22h52M55 13l-2 9" />
      {wheels(22, 90)}
    </>
  ),
  convertible: (
    <>
      <path d="M8 38h7m14 0h54m14 0h10c3 0 4-2 4-4v-4c0-3-2-4-5-5l-14-2H24l-11 2c-4 1-5 3-5 5v4c0 2 0 4 0 4Z" />
      <path d="M40 23l8-10M48 13l4 0M63 23c2-4 6-6 12-6" />
      {wheels(22, 90)}
    </>
  ),
  hatchback: (
    <>
      <path d="M12 38h5m14 0h44m14 0h9c2 0 4-2 4-4v-5c0-3-2-4-5-5l-12-3-9-8c-3-2-6-3-10-3H40c-4 0-7 1-9 3l-9 8-6 1c-3 1-4 3-4 5v6c0 2 0 5 0 5Z" />
      <path d="M26 21h59M48 13v8M70 12v9" />
      {wheels(24, 82)}
    </>
  ),
  electric: (
    <>
      <path d="M8 38h7m14 0h54m14 0h9c3 0 4-2 4-4v-4c0-3-2-4-6-5l-14-3-12-8c-3-2-6-3-10-3H48c-4 0-7 1-10 3l-10 8-14 2c-4 1-6 3-6 6v4c0 2 0 4 0 4Z" />
      <path d="M33 22h59" />
      <path d="M62 8l-6 9h6l-4 8" strokeWidth="1.8" />
      {wheels(22, 90)}
    </>
  ),
};

const lifestyleBody: Record<Lifestyle, keyof typeof bodies> = {
  "luxury-sedans": "sedan",
  suvs: "suv",
  performance: "coupe",
  sports: "convertible",
  electric: "electric",
  "premium-hatchbacks": "hatchback",
};

export function BodyArt({ kind, className = "art" }: { kind: Lifestyle | keyof typeof bodies; className?: string }) {
  const body = bodies[(lifestyleBody as Record<string, string>)[kind] ?? kind] ?? bodies.sedan;
  return (
    <svg className={className} viewBox="0 0 124 50" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {body}
    </svg>
  );
}

const glyphs: Record<string, React.ReactNode> = {
  Petrol: (
    <>
      <path d="M10 42V12c0-2 1-4 4-4h14c3 0 4 2 4 4v30M7 42h28M14 16h14v8H14z" />
      <path d="M32 18l6 5v14c0 2 1 3 3 3s3-1 3-3V22l-5-6" />
    </>
  ),
  Diesel: (
    <>
      <path d="M10 42V12c0-2 1-4 4-4h14c3 0 4 2 4 4v30M7 42h28" />
      <path d="M21 16c3 4 5 6 5 9a5 5 0 0 1-10 0c0-3 2-5 5-9Z" />
      <path d="M32 18l6 5v14c0 2 1 3 3 3s3-1 3-3V22l-5-6" />
    </>
  ),
  Hybrid: (
    <>
      <path d="M24 8c6 8 11 13 11 19a11 11 0 0 1-22 0c0-6 5-11 11-19Z" />
      <path d="M26 20l-5 8h5l-3 7" />
    </>
  ),
  Electric: (
    <>
      <rect x="8" y="14" width="30" height="22" rx="3" />
      <path d="M38 21h3v8h-3M25 18l-6 8h6l-4 7" />
    </>
  ),
  price: (
    <>
      <path d="M8 24 24 8h14v14L22 38z" />
      <circle cx="31" cy="15" r="2.5" />
      <path d="M17 24h8M17 28h6" />
    </>
  ),
  year: (
    <>
      <rect x="8" y="11" width="32" height="29" rx="2" />
      <path d="M8 19h32M16 7v8M32 7v8M15 26h4M22 26h4M29 26h4M15 33h4M22 33h4" />
    </>
  ),
  km: (
    <>
      <path d="M8 34a16 16 0 1 1 32 0" />
      <path d="M24 34l8-10M12 34h2M34 34h2M24 16v2M15 22l1.5 1.5M33 22l-1.5 1.5" />
    </>
  ),
};

export function Glyph({ kind, className = "glyph" }: { kind: string; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {glyphs[kind] ?? glyphs.price}
    </svg>
  );
}
