"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { lifestyles, lifestyleTitle } from "@/data/catalog";
import { applyFilters, filtersFromParams, filtersToParams, priceBands, sortOptions } from "@/lib/filters";
import type { Fuel, InventoryFilters, Lifestyle, SortKey, Transmission, Vehicle } from "@/lib/types";
import { Search } from "./icons";
import { VehicleCard } from "./VehicleCard";

const fuels: Fuel[] = ["Petrol", "Diesel", "Hybrid", "Electric"];
const transmissions: Transmission[] = ["Automatic", "Manual"];
const kmBands = [10_000, 20_000, 30_000];
const yearBands = [2023, 2022, 2021];

export function CollectionBrowser({ vehicles, brands }: { vehicles: Vehicle[]; brands: string[] }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();
  const filters = useMemo(() => filtersFromParams(new URLSearchParams(params.toString())), [params]);
  const [q, setQ] = useState(filters.q ?? "");
  const [panel, setPanel] = useState(false);

  useEffect(() => setQ(filters.q ?? ""), [filters.q]);

  const update = (patch: Partial<InventoryFilters>) => {
    const next = { ...filters, ...patch };
    startTransition(() => router.replace(`${pathname}${filtersToParams(next)}`, { scroll: false }));
  };

  // Debounced search keeps the URL shareable without a history entry per keystroke.
  useEffect(() => {
    if ((filters.q ?? "") === q) return;
    const t = setTimeout(() => update({ q: q || undefined }), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  useEffect(() => {
    document.documentElement.style.overflow = panel ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [panel]);

  const results = useMemo(() => applyFilters(vehicles, filters), [vehicles, filters]);
  /** Count for an option given every other active filter, so customers never pick a dead end. */
  const countWith = (patch: Partial<InventoryFilters>) => applyFilters(vehicles, { ...filters, ...patch }).length;

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

  const clearAll = () => {
    setQ("");
    startTransition(() => router.replace(pathname + filtersToParams({ sort: filters.sort }), { scroll: false }));
  };

  const ctx: OptCtx = { total: results.length, countWith, update };

  return (
    <>
      <div className="toolbar">
        <div className="wrap toolbar__row">
          <label className="search">
            <span className="sr-only">Search the collection</span>
            <Search />
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search — e.g. Porsche 911, electric, 2023" autoComplete="off" />
          </label>
          <div className="chips" aria-label="Active filters">
            {active.map((a) => (
              <button key={a.label} type="button" className="chip chip--remove" onClick={() => update(a.clear)} aria-label={`Remove filter ${a.label}`}>
                {a.label}
              </button>
            ))}
          </div>
          <button type="button" className="chip filters-toggle" onClick={() => setPanel(true)} aria-expanded={panel} aria-controls="filters">
            Filters{active.length > 0 && ` · ${active.length}`}
          </button>
          <label className="select">
            <span className="sr-only">Sort by</span>
            <select value={filters.sort ?? "featured"} onChange={(e) => update({ sort: e.target.value as SortKey })}>
              {sortOptions.map((s) => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="wrap collection">
        <aside id="filters" className={`filters ${panel ? "filters--open" : ""}`} aria-label="Filters">
          <button type="button" className="chip filters__close" onClick={() => setPanel(false)}>Close</button>
          <div className="filter-group">
            <h3>Marque</h3>
            <div className="opt-list">
              {brands.map((b) => (
                <Opt ctx={ctx} key={b} label={b} on={filters.brand === b} patch={{ brand: b }} off={{ brand: undefined }} />
              ))}
            </div>
          </div>
          <div className="filter-group">
            <h3>Lifestyle</h3>
            <div className="opt-list">
              {lifestyles.map((l) => (
                <Opt ctx={ctx} key={l.key} label={l.title} on={filters.lifestyle === l.key} patch={{ lifestyle: l.key as Lifestyle }} off={{ lifestyle: undefined }} />
              ))}
            </div>
          </div>
          <div className="filter-group">
            <h3>Fuel</h3>
            <div className="opt-list">
              {fuels.map((f) => (
                <Opt ctx={ctx} key={f} label={f} on={filters.fuel === f} patch={{ fuel: f }} off={{ fuel: undefined }} />
              ))}
            </div>
          </div>
          <div className="filter-group">
            <h3>Price</h3>
            <div className="opt-list">
              {priceBands.map((b) => (
                <Opt ctx={ctx} key={b.label} label={b.label} on={filters.minPrice === b.min && filters.maxPrice === b.max && (b.min != null || b.max != null)} patch={{ minPrice: b.min, maxPrice: b.max }} off={{ minPrice: undefined, maxPrice: undefined }} />
              ))}
            </div>
          </div>
          <div className="filter-group">
            <h3>Transmission</h3>
            <div className="opt-list">
              {transmissions.map((t) => (
                <Opt ctx={ctx} key={t} label={t} on={filters.transmission === t} patch={{ transmission: t }} off={{ transmission: undefined }} />
              ))}
            </div>
          </div>
          <div className="filter-group">
            <h3>Model year</h3>
            <div className="opt-list">
              {yearBands.map((y) => (
                <Opt ctx={ctx} key={y} label={`${y} or newer`} on={filters.minYear === y} patch={{ minYear: y }} off={{ minYear: undefined }} />
              ))}
            </div>
          </div>
          <div className="filter-group">
            <h3>Kilometres</h3>
            <div className="opt-list">
              {kmBands.map((k) => (
                <Opt ctx={ctx} key={k} label={`Under ${(k / 1000).toFixed(0)},000 km`} on={filters.maxKm === k} patch={{ maxKm: k }} off={{ maxKm: undefined }} />
              ))}
            </div>
          </div>
          {active.length > 0 && (
            <div className="filter-group">
              <button type="button" className="link" onClick={clearAll}>Clear all filters</button>
            </div>
          )}
          <button type="button" className="btn btn--block filters__apply" onClick={() => setPanel(false)}>
            Show {results.length} {results.length === 1 ? "vehicle" : "vehicles"}
          </button>
        </aside>

        <div>
          <div className="results-head" aria-live="polite">
            <span className="num">
              {results.length} of {vehicles.length} vehicles
              {filters.q && <> matching “{filters.q}”</>}
            </span>
          </div>
          {results.length > 0 ? (
            <div className="results">
              {results.map((v, i) => (
                <VehicleCard key={v.slug} v={v} priority={i < 3} />
              ))}
            </div>
          ) : (
            <div className="empty">
              <span className="eyebrow eyebrow--plain">No exact matches</span>
              <h2 className="display h-md" style={{ marginTop: 16 }}>Nothing in the showroom <em>matches — yet.</em></h2>
              <p>Our collection changes every week. Clear a filter, or tell us what you are looking for and we will let you know when it arrives.</p>
              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <button type="button" className="btn" onClick={clearAll}>Clear filters</button>
                <a className="btn btn--ghost" href="/showroom#visit">Ask us to find it</a>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

type OptCtx = { total: number; countWith: (p: Partial<InventoryFilters>) => number; update: (p: Partial<InventoryFilters>) => void };

function Opt({ label, on, patch, off, ctx }: { label: string; on: boolean; patch: Partial<InventoryFilters>; off: Partial<InventoryFilters>; ctx: OptCtx }) {
  const n = on ? ctx.total : ctx.countWith(patch);
  return (
    <button type="button" className="opt" aria-pressed={on} disabled={!on && n === 0} onClick={() => ctx.update(on ? off : patch)}>
      <span className="opt__label">{label}</span>
      <span className="opt__n num">{n}</span>
    </button>
  );
}
