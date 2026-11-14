import type { Metadata } from "next";
import { Suspense } from "react";
import { CollectionBrowser } from "@/components/CollectionBrowser";
import { brandOrder } from "@/data/catalog";
import { applyFilters } from "@/lib/filters";
import { getInventory } from "@/lib/inventory";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "The Collection",
  description: "Browse our collection of pre-owned luxury, performance and electric automobiles. Search, filter and sort by brand, lifestyle, fuel, price and more.",
  alternates: { canonical: "/collection" },
};

export default async function CollectionPage() {
  const vehicles = applyFilters(await getInventory(), {});
  const brands = [...new Set(vehicles.map((v) => v.brand))].sort((a, b) => (brandOrder.indexOf(a) + 1 || 99) - (brandOrder.indexOf(b) + 1 || 99));
  return (
    <>
      <section className="page-hero">
        <div className="wrap page-hero__row">
          <div>
            <span className="eyebrow">The Collection</span>
            <h1 className="display h-xl" style={{ marginTop: 22 }}>
              Every car, <em>in one place.</em>
            </h1>
          </div>
          <p className="lead">Search by name, or refine by marque, lifestyle, fuel, price and kilometres.</p>
        </div>
      </section>
      <Suspense fallback={<div className="wrap" style={{ minHeight: "60vh" }} />}>
        <CollectionBrowser vehicles={vehicles} brands={brands} />
      </Suspense>
    </>
  );
}
