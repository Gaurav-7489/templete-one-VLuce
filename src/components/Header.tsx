"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { dealership } from "@/config/dealership";
import { lifestyles } from "@/data/catalog";
import { filtersFromParams, filtersToParams, kmBands, priceBands, yearBands } from "@/lib/filters";
import type { Fuel, InventoryFilters } from "@/lib/types";
import { Arrow, MenuIcon, Search, TabIcon } from "./icons";
import { useShortlist } from "./shortlist";

const menu = [
  { href: "/", label: "Home" },
  { href: "/collection", label: "Explore the Collection" },
  { href: "/collection?lifestyle=electric", label: "Electric Cars" },
  { href: "/sell", label: "Sell Your Car" },
  { href: "/showroom", label: "Our Showroom" },
  { href: "/showroom#visit", label: "Book a Visit" },
  { href: "/shortlist", label: "Your Shortlist" },
];

const fuels: Fuel[] = ["Petrol", "Diesel", "Hybrid", "Electric"];
const hints = ["brand", "model", "body type", "fuel"];

type Option = { label: string; on: boolean; patch: Partial<InventoryFilters>; off: Partial<InventoryFilters> };

export function Header({ brands }: { brands: string[] }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const router = useRouter();
  const onCollection = pathname === "/collection";
  const filters = filtersFromParams(new URLSearchParams(onCollection ? params.toString() : ""));
  const [menuOpen, setMenuOpen] = useState(false);
  const [group, setGroup] = useState<string | null>(null);
  const [q, setQ] = useState(filters.q ?? "");
  const [hint, setHint] = useState(0);
  const { list } = useShortlist();
  const closeRef = useRef<HTMLButtonElement>(null);
  const openRef = useRef<HTMLButtonElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => setQ(filters.q ?? ""), [filters.q]);
  useEffect(() => {
    setMenuOpen(false);
    setGroup(null);
  }, [pathname, params]);
  useEffect(() => {
    const t = setInterval(() => setHint((h) => (h + 1) % hints.length), 2600);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    document.documentElement.style.overflow = menuOpen ? "hidden" : "";
    if (menuOpen) closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (menuOpen) {
        setMenuOpen(false);
        openRef.current?.focus();
      }
      setGroup(null);
    };
    const onDown = (e: MouseEvent) => {
      if (!headerRef.current?.contains(e.target as Node)) setGroup(null);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onDown);
    };
  }, [menuOpen]);

  /** Every header control lands on the collection with the filter applied, from any page. */
  const go = (patch: Partial<InventoryFilters>) => router.push(`/collection${filtersToParams({ ...filters, ...patch })}`, { scroll: !onCollection });

  const groups: { key: string; label: string; options: Option[] }[] = [
    { key: "price", label: "Price", options: priceBands.map((b) => ({ label: b.label, on: filters.minPrice === b.min && filters.maxPrice === b.max, patch: { minPrice: b.min, maxPrice: b.max }, off: { minPrice: undefined, maxPrice: undefined } })) },
    { key: "brand", label: "Brand", options: brands.map((b) => ({ label: b, on: filters.brand === b, patch: { brand: b }, off: { brand: undefined } })) },
    { key: "category", label: "Category", options: lifestyles.map((l) => ({ label: l.title, on: filters.lifestyle === l.key, patch: { lifestyle: l.key }, off: { lifestyle: undefined } })) },
    { key: "fuel", label: "Fuel", options: fuels.map((f) => ({ label: f, on: filters.fuel === f, patch: { fuel: f }, off: { fuel: undefined } })) },
    { key: "year", label: "Year", options: yearBands.map((y) => ({ label: `${y} or newer`, on: filters.minYear === y, patch: { minYear: y }, off: { minYear: undefined } })) },
    { key: "km", label: "KM Driven", options: kmBands.map((k) => ({ label: `Under ${(k / 1000).toFixed(0)},000 km`, on: filters.maxKm === k, patch: { maxKm: k }, off: { maxKm: undefined } })) },
  ];
  const openGroup = groups.find((g) => g.key === group);

  return (
    <>
      <header ref={headerRef} className="header dark">
        <div className="header__bar">
          <div className="header__inner">
            <Link href="/" className="wordmark" aria-label={`${dealership.name} — home`}>
              <span className="wordmark__name">{dealership.wordmark}</span>
              <span className="wordmark__desc">{dealership.descriptor}</span>
            </Link>
            <nav className="tabs" aria-label="Browse by category">
              <Link href="/collection" aria-current={onCollection && !filters.lifestyle ? "true" : undefined}>
                <TabIcon name="all" /> All
              </Link>
              {lifestyles.map((l) => (
                <Link key={l.key} href={`/collection?lifestyle=${l.key}`} aria-current={filters.lifestyle === l.key ? "true" : undefined}>
                  <TabIcon name={l.key} /> {l.title}
                </Link>
              ))}
            </nav>
            <form
              className="hsearch"
              role="search"
              onSubmit={(e) => {
                e.preventDefault();
                router.push(`/collection${filtersToParams({ q: q.trim() || undefined })}`);
              }}
            >
              <Search />
              <input type="search" name="q" value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search by ${hints[hint]}`} aria-label="Search the collection" autoComplete="off" />
              <button type="submit" aria-label="Search"><Arrow /></button>
            </form>
            <button ref={openRef} type="button" className="menu-btn" aria-label={`Open menu${list.length ? `, ${list.length} cars saved` : ""}`} aria-expanded={menuOpen} aria-controls="site-menu" onClick={() => setMenuOpen(true)}>
              <MenuIcon />
              {list.length > 0 && <span className="shortlist-count">{list.length}</span>}
            </button>
          </div>
        </div>
        <div className="explore">
          <div className="explore__row" role="group" aria-label="Explore by">
            <span className="explore__label">Explore By</span>
            {groups.map((g) => (
              <button key={g.key} type="button" className="explore__btn" aria-expanded={group === g.key} data-on={g.options.some((o) => o.on)} onClick={() => setGroup(group === g.key ? null : g.key)}>
                {g.label}
              </button>
            ))}
          </div>
          {openGroup && (
            <div className="explore__panel">
              {openGroup.options.map((o) => (
                <button key={o.label} type="button" className="explore__opt" aria-pressed={o.on} onClick={() => go(o.on ? o.off : o.patch)}>
                  {o.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <div id="site-menu" className={`menu dark ${menuOpen ? "menu--open" : ""}`} role="dialog" aria-modal="true" aria-label="Site menu" aria-hidden={!menuOpen} inert={!menuOpen} onClick={(e) => e.target === e.currentTarget && setMenuOpen(false)}>
        <div className="menu__sheet">
          <button ref={closeRef} type="button" className="menu__close" onClick={() => setMenuOpen(false)}>Close</button>
          <ul className="menu__list">
            {menu.map((m) => (
              <li key={m.href}>
                <Link href={m.href} onClick={() => setMenuOpen(false)}>
                  {m.label}
                  {m.href === "/shortlist" && list.length > 0 && ` (${list.length})`}
                </Link>
              </li>
            ))}
          </ul>
          <div>
            <span className="eyebrow">Browse by brand</span>
            <div className="menu__brands">
              {brands.map((b) => (
                <Link key={b} href={`/collection?brand=${encodeURIComponent(b)}`} onClick={() => setMenuOpen(false)}>{b}</Link>
              ))}
            </div>
          </div>
          <div className="menu__meta">
            <div>
              <strong>Showroom</strong>
              {dealership.showroom.addressLines.join(", ")}, {dealership.showroom.city}
            </div>
            <div>
              <strong>Contact</strong>
              <a href={`tel:+${dealership.contact.phoneE164}`}>{dealership.contact.phone}</a>
              <br />
              <a href={`mailto:${dealership.contact.email}`}>{dealership.contact.email}</a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
