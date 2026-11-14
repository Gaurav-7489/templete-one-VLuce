"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { lifestyles, lifestyleTitle } from "@/data/catalog";
import { applyFilters, filtersFromParams, filtersToParams, priceBands, sortOptions } from "@/lib/filters";
import type { Fuel, InventoryFilters, Lifestyle, SortKey, Transmission, Vehicle } from "@/lib/types";
import { Search } from "./icons";
import { BrandLogo } from "./BrandLogo";
import { BodyArt, Glyph } from "./Illustrations";
import { Stagger } from "./motion/Stagger";
import { VehicleCard } from "./VehicleCard";

const fuels: Fuel[] = ["Petrol", "Diesel", "Hybrid", "Electric"];
const transmissions: Transmission[] = ["Automatic", "Manual"];
const kmBands = [10_000, 20_000, 30_000, 50_000];
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

  const heading = filters.brand
    ? `${filters.brand} Collection`
    : filters.lifestyle
      ? lifestyleTitle(filters.lifestyle)
      : filters.fuel
        ? `${filters.fuel} Cars`
        : filters.q
          ? `Results for “${filters.q}”`
          : "All Collections";

  return (
    <div className="theme-light">
      <div className="wrap">
        <div className="lhead">
          <div>
            <h1>{heading}</h1>
            <p aria-live="polite">
              {results.length === vehicles.length ? "Explore our complete luxury collection" : `${results.length} of ${vehicles.length} cars match your selection`}
            </p>
          </div>
          <div className="lhead__tools">
            <button type="button" className="fbtn" onClick={() => setPanel(true)} aria-expanded={panel} aria-controls="filters">
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" /><circle cx="16" cy="6" r="2" /><circle cx="10" cy="12" r="2" /><circle cx="18" cy="18" r="2" /></svg>
              Filter{active.length > 0 && <span className="fbtn__n">{active.length}</span>}
            </button>
            <label className="sortby">
              <span>Sort by:</span>
              <select value={filters.sort ?? "featured"} onChange={(e) => update({ sort: e.target.value as SortKey })} aria-label="Sort by">
                {sortOptions.map((o) => (
                  <option key={o.key} value={o.key}>{o.label}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {(active.length > 0 || filters.q) && (
          <div className="lchips" aria-label="Active filters">
            {filters.q && (
              <button type="button" className="lchip" onClick={() => { setQ(""); update({ q: undefined }); }} aria-label={`Remove search ${filters.q}`}>“{filters.q}”</button>
            )}
            {active.map((a) => (
              <button key={a.label} type="button" className="lchip" onClick={() => update(a.clear)} aria-label={`Remove filter ${a.label}`}>{a.label}</button>
            ))}
            <button type="button" className="lclear" onClick={clearAll}>Clear all</button>
          </div>
        )}

        {results.length > 0 ? (
          <Stagger key={JSON.stringify(filters)} className="lgrid">
            {results.map((v, i) => <VehicleCard key={v.slug} v={v} priority={i < 3} />)}
          </Stagger>
        ) : (
          <div className="lgrid">
            <div className="lempty">
              <h2>No cars match these filters — yet.</h2>
              <p>Our collection changes every week. Clear a filter, or tell us what you are looking for and we will let you know when it arrives.</p>
              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <button type="button" className="btn" onClick={clearAll}>Clear filters</button>
                <a className="btn btn--ghost" href="/showroom#visit">Ask us to find it</a>
              </div>
            </div>
          </div>
        )}
      </div>

      {panel && <div className="fdrawer-backdrop" onClick={() => setPanel(false)} aria-hidden="true" />}
      <aside id="filters" className={`fdrawer ${panel ? "fdrawer--open" : ""}`} aria-label="Filters" aria-hidden={!panel} inert={!panel}>
        <div className="fdrawer__head">
          <span>Filter</span>
          <button type="button" onClick={() => setPanel(false)} aria-label="Close filters">×</button>
        </div>
        <div className="fdrawer__body" data-lenis-prevent>
          <label className="search">
            <span className="sr-only">Search the collection</span>
            <Search />
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search — e.g. Porsche 911, 2023" autoComplete="off" />
          </label>
          <div className="filter-group">
            <h3>Brand</h3>
            <div className="vtiles vtiles--3">
              {brands.map((b) => (
                <VTile ctx={ctx} key={b} label={b} art={<BrandLogo brand={b} className="vtile__logo" />} on={filters.brand === b} patch={{ brand: b }} off={{ brand: undefined }} />
              ))}
            </div>
          </div>
          <div className="filter-group">
            <h3>Category</h3>
            <div className="vtiles">
              {lifestyles.map((l) => (
                <VTile ctx={ctx} key={l.key} label={l.title} art={<BodyArt kind={l.key} className="vtile__art" />} on={filters.lifestyle === l.key} patch={{ lifestyle: l.key as Lifestyle }} off={{ lifestyle: undefined }} />
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
            <h3>Fuel</h3>
            <div className="vtiles vtiles--4">
              {fuels.map((f) => (
                <VTile ctx={ctx} key={f} label={f} art={<Glyph kind={f} className="vtile__glyph" />} on={filters.fuel === f} patch={{ fuel: f }} off={{ fuel: undefined }} />
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
            <h3>Year</h3>
            <div className="opt-list">
              {yearBands.map((y) => (
                <Opt ctx={ctx} key={y} label={`${y} & newer`} on={filters.minYear === y} patch={{ minYear: y }} off={{ minYear: undefined }} />
              ))}
            </div>
          </div>
          <div className="filter-group">
            <h3>KM Driven</h3>
            <div className="opt-list">
              {kmBands.map((k) => (
                <Opt ctx={ctx} key={k} label={`Under ${k.toLocaleString("en-IN")} km`} on={filters.maxKm === k} patch={{ maxKm: k }} off={{ maxKm: undefined }} />
              ))}
            </div>
          </div>
        </div>
        <div className="fdrawer__foot">
          <button type="button" className="btn btn--ghost" onClick={clearAll}>Clear</button>
          <button type="button" className="btn" onClick={() => setPanel(false)}>
            Show {results.length} {results.length === 1 ? "car" : "cars"}
          </button>
        </div>
      </aside>
    </div>
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

function VTile({ label, art, on, patch, off, ctx }: { label: string; art: React.ReactNode; on: boolean; patch: Partial<InventoryFilters>; off: Partial<InventoryFilters>; ctx: OptCtx }) {
  const n = on ? ctx.total : ctx.countWith(patch);
  return (
    <button type="button" className="vtile" aria-pressed={on} disabled={!on && n === 0} onClick={() => ctx.update(on ? off : patch)}>
      {art}
      <span className="vtile__label">{label}</span>
      <span className="vtile__n num">{n}</span>
    </button>
  );
}
