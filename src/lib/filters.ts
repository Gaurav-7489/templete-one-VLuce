import type { InventoryFilters, SortKey, Vehicle } from "./types";

export const sortOptions: { key: SortKey; label: string }[] = [
  { key: "featured", label: "Recommended" },
  { key: "price-desc", label: "Price — high to low" },
  { key: "price-asc", label: "Price — low to high" },
  { key: "year-desc", label: "Newest first" },
  { key: "km-asc", label: "Lowest kilometres" },
];

const availabilityRank = { available: 0, reserved: 1, "coming-soon": 2, sold: 3 } as const;

/** Pure filtering and sorting used by the collection page. Sold cars are never listed publicly. */
export function applyFilters(all: Vehicle[], f: InventoryFilters): Vehicle[] {
  const q = f.q?.trim().toLowerCase();
  const words = q ? q.split(/\s+/) : [];
  const list = all.filter((v) => {
    if (v.availability === "sold") return false;
    if (f.brand && v.brand.toLowerCase() !== f.brand.toLowerCase()) return false;
    if (f.lifestyle && !v.lifestyle.includes(f.lifestyle)) return false;
    if (f.fuel && v.fuel !== f.fuel) return false;
    if (f.transmission && v.transmission !== f.transmission) return false;
    if (f.minPrice != null && (v.price ?? Infinity) < f.minPrice) return false;
    if (f.maxPrice != null && (v.price ?? 0) > f.maxPrice) return false;
    if (f.minYear != null && v.year < f.minYear) return false;
    if (f.maxKm != null && v.km > f.maxKm) return false;
    if (words.length) {
      const hay = `${v.year} ${v.brand} ${v.model} ${v.variant} ${v.bodyType} ${v.fuel} ${v.exterior}`.toLowerCase();
      if (!words.every((w) => hay.includes(w))) return false;
    }
    return true;
  });
  const sort = f.sort ?? "featured";
  const byPrice = (v: Vehicle) => v.price ?? Number.MAX_SAFE_INTEGER;
  return [...list].sort((a, b) => {
    switch (sort) {
      case "price-asc":
        return byPrice(a) - byPrice(b);
      case "price-desc":
        return byPrice(b) - byPrice(a);
      case "year-desc":
        return b.year - a.year || a.km - b.km;
      case "km-asc":
        return a.km - b.km;
      default:
        return (
          availabilityRank[a.availability] - availabilityRank[b.availability] ||
          Number(!!b.featured) - Number(!!a.featured) ||
          byPrice(b) - byPrice(a)
        );
    }
  });
}

export const priceBands = [
  { label: "Under ₹50 Lakh", min: undefined, max: 50_00_000 },
  { label: "₹50 Lakh – ₹1 Cr", min: 50_00_000, max: 1_00_00_000 },
  { label: "₹1 Cr – ₹2 Cr", min: 1_00_00_000, max: 2_00_00_000 },
  { label: "Above ₹2 Cr", min: 2_00_00_000, max: undefined },
];

export function filtersFromParams(p: URLSearchParams): InventoryFilters {
  const num = (k: string) => {
    const v = p.get(k);
    if (!v) return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };
  return {
    q: p.get("q") ?? undefined,
    brand: p.get("brand") ?? undefined,
    lifestyle: (p.get("lifestyle") as InventoryFilters["lifestyle"]) ?? undefined,
    fuel: (p.get("fuel") as InventoryFilters["fuel"]) ?? undefined,
    transmission: (p.get("transmission") as InventoryFilters["transmission"]) ?? undefined,
    minPrice: num("minPrice"),
    maxPrice: num("maxPrice"),
    minYear: num("minYear"),
    maxKm: num("maxKm"),
    sort: (p.get("sort") as SortKey) ?? undefined,
  };
}

export function filtersToParams(f: InventoryFilters): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(f)) {
    if (v === undefined || v === "" || v === null) continue;
    if (k === "sort" && v === "featured") continue;
    p.set(k, String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}
