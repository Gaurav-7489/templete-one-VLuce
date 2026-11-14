import type { Lifestyle } from "@/lib/types";

const u = (id: string, w = 1600) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

/** Display order for the "Explore by Brand" section. Brands without listings are shown as "coming soon" or hidden (see BrandIndex). */
export const brandOrder = ["Porsche", "Mercedes-Benz", "BMW", "Audi", "Land Rover", "Jaguar", "Volvo", "Lexus", "MINI"];

export type LifestyleMeta = { key: Lifestyle; title: string; line: string; image: string };

export const lifestyles: LifestyleMeta[] = [
  { key: "luxury-sedans", title: "Luxury Sedans", line: "Composure, craft and quiet.", image: u("1618843479313-40f8afb4b4d8") },
  { key: "suvs", title: "SUVs", line: "Presence on every road.", image: u("1606611013016-969c19ba27bb") },
  { key: "performance", title: "Performance", line: "Engineered to be driven.", image: u("1555215695-3004980ad54e") },
  { key: "sports", title: "Sports Cars", line: "Two doors. No apologies.", image: u("1503376780353-7e6692767b70") },
  { key: "electric", title: "Electric", line: "Silent, instant, effortless.", image: u("1560958089-b8a1929cea89") },
  { key: "premium-hatchbacks", title: "Premium Hatchbacks", line: "Compact, characterful, complete.", image: u("1525609004556-c46c7d6cf023") },
];

export const lifestyleTitle = (k: string) => lifestyles.find((l) => l.key === k)?.title ?? k;
