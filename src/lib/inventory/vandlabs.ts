import { slugify } from "../format";
import type { Availability, Fuel, Lifestyle, Transmission, Vehicle, VehicleSpecs } from "../types";
import type { InventorySource } from "./source";

/**
 * VandLabs Automotive Intelligence — inventory adapter (only for dealerships that subscribe).
 *
 * Verified against the Intelligence repository (apps/intelligence/app/api/v1/inventory/route.ts):
 *   GET {VANDLABS_API_URL}/api/v1/inventory
 *   Authorization: Bearer <Business API key with the "inventory:read" scope>
 *   → { data: Array<{ stockId, branchId, make, model, variant, year, priceInr, odometerKm, fuel,
 *                     transmission, owners, availability, published, photos, updatedAt }> }
 *
 * The key is read on the server only and is never sent to the browser. Only published vehicles
 * that are available or reserved are listed. Costs and margins are not exposed by that API.
 *
 * Body type, colours, description, highlights, categories and headline specifications are used when
 * Intelligence has them recorded; otherwise those sections are hidden. See docs/INTEGRATION.md.
 */

type ApiVehicle = {
  stockId: string;
  make?: string;
  model?: string;
  variant?: string;
  year?: number;
  priceInr?: number | null;
  odometerKm?: number;
  fuel?: string;
  transmission?: string;
  owners?: number | string;
  availability?: string;
  published?: boolean;
  photos?: string[];
  bodyType?: string;
  exteriorColor?: string;
  interiorColor?: string;
  description?: string;
  features?: string[];
  categories?: string[];
  registrationState?: string;
  featured?: boolean;
  specifications?: Record<string, string>;
};

const LIFESTYLES: Lifestyle[] = ["luxury-sedans", "suvs", "performance", "sports", "electric", "premium-hatchbacks"];
const SPEC_KEYS = ["engine", "power", "torque", "acceleration", "topSpeed", "drivetrain", "seats", "range", "battery"] as const;

const fuelMap: Record<string, Fuel> = { petrol: "Petrol", diesel: "Diesel", hybrid: "Hybrid", electric: "Electric", ev: "Electric", cng: "Petrol" };
const availMap: Record<string, Availability> = { available: "available", reserved: "reserved", sold: "sold" };

export function mapApiVehicle(a: ApiVehicle, city: string): Vehicle | null {
  if (!a.published || !a.stockId) return null;
  const availability = availMap[String(a.availability ?? "").toLowerCase()];
  if (availability !== "available" && availability !== "reserved") return null;
  const fuel = fuelMap[String(a.fuel ?? "").toLowerCase()] ?? "Petrol";
  const transmission: Transmission = /man/i.test(String(a.transmission ?? "")) ? "Manual" : "Automatic";
  const tagged = (a.categories ?? []).filter((c): c is Lifestyle => (LIFESTYLES as string[]).includes(c));
  const lifestyle: Lifestyle[] = tagged.length ? tagged : fuel === "Electric" ? ["electric"] : [];
  const specs: VehicleSpecs = Object.fromEntries(SPEC_KEYS.filter((k) => typeof a.specifications?.[k] === "string").map((k) => [k, a.specifications![k]]));
  const brand = a.make ?? "";
  const model = a.model ?? "";
  const variant = a.variant ?? "";
  const year = Number(a.year) || new Date().getFullYear();
  return {
    slug: slugify(`${year} ${brand} ${model} ${variant} ${a.stockId}`),
    stockId: a.stockId,
    brand,
    model,
    variant,
    year,
    price: typeof a.priceInr === "number" && a.priceInr > 0 ? a.priceInr : null,
    fuel,
    transmission,
    km: Number(a.odometerKm) || 0,
    owners: Number(a.owners) || 1,
    bodyType: a.bodyType ?? "",
    lifestyle,
    availability,
    exterior: a.exteriorColor ?? "",
    interior: a.interiorColor ?? "",
    registration: a.registrationState || undefined,
    city,
    images: Array.isArray(a.photos) ? a.photos.filter((p) => typeof p === "string" && /^https:\/\//.test(p)) : [],
    highlights: Array.isArray(a.features) ? a.features.filter((f) => typeof f === "string").slice(0, 12) : [],
    specs,
    description: a.description ?? "",
    featured: a.featured === true,
  };
}

export function vandlabsSource(opts: { baseUrl: string; apiKey: string; city: string; revalidate: number }): InventorySource {
  return {
    id: "vandlabs",
    async list() {
      const url = new URL("/api/v1/inventory", opts.baseUrl);
      try {
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${opts.apiKey}`, Accept: "application/json" },
          next: { revalidate: opts.revalidate, tags: ["inventory"] },
        });
        if (!res.ok) {
          console.error(JSON.stringify({ event: "vandlabs_inventory_error", status: res.status }));
          return [];
        }
        const body = (await res.json()) as { data?: ApiVehicle[] };
        return (body.data ?? []).map((a) => mapApiVehicle(a, opts.city)).filter((v): v is Vehicle => v !== null);
      } catch (error) {
        console.error(JSON.stringify({ event: "vandlabs_inventory_unreachable", message: error instanceof Error ? error.message : "unknown" }));
        return [];
      }
    },
  };
}
