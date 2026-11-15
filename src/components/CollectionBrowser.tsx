"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useTransition } from "react";
import { dealership } from "@/config/dealership";
import { lifestyleTitle } from "@/data/catalog";
import { applyFilters, filtersFromParams, filtersToParams, priceBands, sortOptions } from "@/lib/filters";
import type { InventoryFilters, SortKey, Vehicle } from "@/lib/types";
import { VehicleCard } from "./VehicleCard";

/**
 * The collection and its search results. Filters live in the URL (set by the header's search and
 * "Explore By" bar), so every view is shareable and the back button works.
 */
export function CollectionBrowser({ vehicles }: { vehicles: Vehicle[] }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();
  const filters = useMemo(() => filtersFromParams(new URLSearchParams(params.toString())), [params]);
  const results = useMemo(() => applyFilters(vehicles, filters), [vehicles, filters]);
  const q = filters.q?.trim();

  const update = (patch: Partial<InventoryFilters>) => startTransition(() => router.replace(`${pathname}${filtersToParams({ ...filters, ...patch })}`, { scroll: false }));

  const active: { label: string; clear: Partial<InventoryFilters> }[] = [
    filters.brand && { label: filters.brand, clear: { brand: undefined } },
    filters.lifestyle && { label: lifestyleTitle(filters.lifestyle), clear: { lifestyle: undefined } },
    filters.fuel && { label: filters.fuel, clear: { fuel: undefined } },
    filters.transmission && { label: filters.transmission, clear: { transmission: undefined } },
    (filters.minPrice != null || filters.maxPrice != null) && {
      label: priceBands.find((b) => b.min === filters.minPrice && b.max === filters.maxPrice)?.label ?? "Price",
      clear: { minPrice: undefined, maxPrice: undefined },
    },
    filters.minYear != null && { label: `${filters.minYear} or newer`, clear: { minYear: undefined } },
    filters.maxKm != null && { label: `Under ${filters.maxKm / 1000}k km`, clear: { maxKm: undefined } },
  ].filter(Boolean) as { label: string; clear: Partial<InventoryFilters> }[];

  const what = q ? `“${q}”` : active.length ? "these filters" : "";
  // When nothing matches, the page still sells: the newest available cars are offered instead.
  const suggestions = useMemo(() => applyFilters(vehicles, {}).filter((v) => v.availability === "available").slice(0, 6), [vehicles]);

  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <div className="page-hero__row">
            <ol className="crumbs" aria-label="Breadcrumb">
              <li><Link href="/">Home</Link></li>
              <li aria-current="page">{q ? "Search" : "Collection"}</li>
            </ol>
            <h1 className="display h-xl">
              {q ? <>Search By <em>&quot;{q}&quot;</em></> : filters.lifestyle ? <>Explore <em>{lifestyleTitle(filters.lifestyle)}</em></> : filters.brand ? <>Explore <em>{filters.brand}</em></> : <>Explore <em>The Collection</em></>}
            </h1>
          </div>
        </div>
      </section>

      <div className="wrap collection">
        {results.length > 0 ? (
          <>
            <div className="results-bar">
              <span className="num" aria-live="polite">
                {results.length} {results.length === 1 ? "car" : "cars"}
                {results.length !== vehicles.length && ` of ${vehicles.length}`}
              </span>
              <div className="chips" role="group" aria-label="Active filters">
                {active.map((a) => (
                  <button key={a.label} type="button" className="chip chip--remove" onClick={() => update(a.clear)} aria-label={`Remove filter ${a.label}`}>
                    {a.label}
                  </button>
                ))}
              </div>
              <label className="select">
                <span className="sr-only">Sort by</span>
                <select value={filters.sort ?? "featured"} onChange={(e) => update({ sort: e.target.value as SortKey })}>
                  {sortOptions.map((s) => (
                    <option key={s.key} value={s.key}>{s.label}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="results">
              {results.map((v, i) => (
                <VehicleCard key={v.slug} v={v} priority={i < 3} />
              ))}
            </div>
          </>
        ) : (
          <div className="empty" aria-live="polite">
            <h2>
              No results found
              {what && <span>With {what}</span>}
            </h2>
            <Link className="btn" href="/collection">Explore All</Link>
          </div>
        )}
      </div>

      {results.length === 0 && suggestions.length > 0 && (
        <>
          <section className="section section--light section--tight">
            <div className="wrap head" style={{ marginBottom: 0 }}>
              <h2 className="duo">You May Also Like <b>Explore Top Choices</b></h2>
              <p className="lead">{dealership.description}</p>
            </div>
          </section>
          <section className="section section--tight">
            <div className="wrap">
              <div className="results">
                {suggestions.map((v) => <VehicleCard key={v.slug} v={v} />)}
              </div>
            </div>
          </section>
        </>
      )}
    </>
  );
}
