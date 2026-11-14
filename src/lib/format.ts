import type { Availability, Vehicle } from "./types";

/** Indian price formatting: ₹1.72 Cr, ₹62.5 Lakh. */
export function formatPrice(price: number | null): string {
  if (price == null) return "Price on request";
  if (price >= 1_00_00_000) return `₹${trim(price / 1_00_00_000)} Cr`;
  if (price >= 1_00_000) return `₹${trim(price / 1_00_000)} Lakh`;
  return `₹${price.toLocaleString("en-IN")}`;
}

const trim = (n: number) => (Math.round(n * 100) / 100).toString();

export const formatRupees = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

export const formatKm = (km: number) => `${km.toLocaleString("en-IN")} km`;

export const ownerLabel = (n: number) => (n === 1 ? "1st owner" : n === 2 ? "2nd owner" : n === 3 ? "3rd owner" : `${n}th owner`);

export const availabilityLabel: Record<Availability, string> = {
  available: "Available",
  reserved: "Reserved",
  "coming-soon": "Arriving soon",
  sold: "Sold",
};

export const vehicleTitle = (v: Pick<Vehicle, "year" | "brand" | "model" | "variant">) => `${v.year} ${v.brand} ${v.model} ${v.variant}`;

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");

/** Full rupee price as shown on listings: ₹ 1,72,00,000. */
export const fullPrice = (p: number | null) => (p == null ? "Price on request" : `₹ ${p.toLocaleString("en-IN")}`);

/** Standard reducing-balance EMI. Indicative only. */
export function emi(principal: number, annualRatePct: number, months: number) {
  if (principal <= 0 || months <= 0) return 0;
  const r = annualRatePct / 12 / 100;
  if (r === 0) return principal / months;
  const f = Math.pow(1 + r, months);
  return (principal * r * f) / (f - 1);
}
