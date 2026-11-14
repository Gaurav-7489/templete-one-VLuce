import { slugify } from "../format";
import type { Availability, Fuel, Lifestyle, Transmission, Vehicle } from "../types";
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
 * The Business API does not return body type, colours, specifications or marketing copy, so
 * those fields are left empty or inferred; see docs/INTEGRATION.md.
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
};

const fuelMap: Record<string, Fuel> = { petrol: "Petrol", diesel: "Diesel", hybrid: "Hybrid", electric: "Electric", ev: "Electric", cng: "Petrol" };
const availMap: Record<string, Availability> = { available: "available", reserved: "reserved", sold: "sold" };

export function mapApiVehicle(a: ApiVehicle, city: string): Vehicle | null {
  if (!a.published || !a.stockId) return null;
  const availability = availMap[String(a.availability ?? "").toLowerCase()];
  if (availability !== "available" && availability !== "reserved") return null;
  const fuel = fuelMap[String(a.fuel ?? "").toLowerCase()] ?? "Petrol";
  const transmission: Transmission = /man/i.test(String(a.transmission ?? "")) ? "Manual" : "Automatic";
  const lifestyle: Lifestyle[] = fuel === "Electric" ? ["electric"] : [];
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
    bodyType: "",
    lifestyle,
    availability,
    exterior: "",
    interior: "",
    city,
    images: Array.isArray(a.photos) ? a.photos.filter((p) => typeof p === "string" && /^https:\/\//.test(p)) : [],
    highlights: [],
    specs: {},
    description: "",
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
