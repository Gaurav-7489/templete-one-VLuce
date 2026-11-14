import type { Metadata } from "next";
import { Suspense } from "react";
import { CollectionBrowser } from "@/components/CollectionBrowser";
import { applyFilters } from "@/lib/filters";
import { getInventory } from "@/lib/inventory";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "The Collection",
  description: "Browse our collection of pre-owned luxury, performance and electric cars. Search, or explore by price, brand, category, fuel, year and kilometres.",
  alternates: { canonical: "/collection" },
};

export default async function CollectionPage() {
  const vehicles = applyFilters(await getInventory(), {});
  return (
    <Suspense fallback={<div className="wrap" style={{ minHeight: "70vh" }} />}>
      <CollectionBrowser vehicles={vehicles} />
    </Suspense>
  );
}
