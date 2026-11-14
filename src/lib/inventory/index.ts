import { cache } from "react";
import { dealership } from "@/config/dealership";
import type { Vehicle } from "../types";
import { getConnection, intelligenceUrl, websiteKey } from "../vandlabs/connection";
import { demoSource } from "./demo";
import type { InventorySource } from "./source";
import { vandlabsSource } from "./vandlabs";

/**
 * Picks the inventory source. With no configuration the site shows its demo collection. Once the website is
 * connected to Intelligence (from /connect, or INVENTORY_SOURCE=vandlabs with a key), it shows that workspace's
 * published stock instead, and demo cars are never mixed in.
 */
export async function inventorySource(): Promise<InventorySource> {
  if (process.env.INVENTORY_SOURCE === "demo") return demoSource;
  const baseUrl = intelligenceUrl();
  const apiKey = websiteKey();
  if (baseUrl && apiKey && (process.env.INVENTORY_SOURCE === "vandlabs" || (await getConnection()))) {
    return vandlabsSource({ baseUrl, apiKey, city: dealership.showroom.city, revalidate: Number(process.env.VANDLABS_REVALIDATE_SECONDS) || 300 });
  }
  if (process.env.INVENTORY_SOURCE === "vandlabs") console.warn("INVENTORY_SOURCE=vandlabs but VANDLABS_API_URL or a key is missing; using demo inventory.");
  return demoSource;
}

export const getInventory = cache(async (): Promise<Vehicle[]> => (await inventorySource()).list());

export async function getVehicle(slug: string): Promise<Vehicle | undefined> {
  return (await getInventory()).find((v) => v.slug === slug);
}

export async function getBrands(): Promise<{ brand: string; count: number }[]> {
  const counts = new Map<string, number>();
  for (const v of await getInventory()) counts.set(v.brand, (counts.get(v.brand) ?? 0) + 1);
  return [...counts].map(([brand, count]) => ({ brand, count }));
}

export function similarVehicles(all: Vehicle[], v: Vehicle, n = 3): Vehicle[] {
  const score = (o: Vehicle) =>
    (o.brand === v.brand ? 2 : 0) + o.lifestyle.filter((l) => v.lifestyle.includes(l)).length + (v.price && o.price && Math.abs(o.price - v.price) / v.price < 0.35 ? 1 : 0);
  return all
    .filter((o) => o.slug !== v.slug)
    .map((o) => ({ o, s: score(o) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, n)
    .map((x) => x.o);
}
