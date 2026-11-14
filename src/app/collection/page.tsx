import type { Metadata } from "next";
import { Suspense } from "react";
import { CollectionBrowser } from "@/components/CollectionBrowser";
import { brandOrder } from "@/data/catalog";
import { applyFilters } from "@/lib/filters";
import { getInventory } from "@/lib/inventory";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "All Collections",
  description: "Browse our collection of pre-owned luxury, performance and electric cars. Filter by brand, category, fuel, price, year and kilometres.",
  alternates: { canonical: "/collection" },
};

export default async function CollectionPage() {
  const vehicles = applyFilters(await getInventory(), {});
  const brands = [...new Set(vehicles.map((v) => v.brand))].sort((a, b) => (brandOrder.indexOf(a) + 1 || 99) - (brandOrder.indexOf(b) + 1 || 99));
  return (
    <Suspense fallback={<div className="theme-light" style={{ minHeight: "80vh" }} />}>
      <CollectionBrowser vehicles={vehicles} brands={brands} />
    </Suspense>
  );
}
