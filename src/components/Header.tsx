"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { dealership } from "@/config/dealership";
import { brandDirectory, lifestyles } from "@/data/catalog";
import { priceBands } from "@/lib/filters";
import { BodyArt, Glyph } from "./Illustrations";
import { Photo } from "./Photo";

/** Category tabs in the top bar. Each one is a saved view of the collection. */
const tabs: { label: string; href: string; icon: ReactNode }[] = [
  { label: "All", href: "/collection", icon: <TabIcon d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 4v10M7 12h10" /> },
  { label: `${dealership.wordmark} Collection`, href: "/collection?sort=price-desc", icon: <TabIcon d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7L12 3Z" /> },
  { label: "Electric Cars", href: "/collection?lifestyle=electric", icon: <TabIcon d="M13 2 5 14h6l-1 8 8-12h-6l1-8Z" /> },
  { label: "SUVs", href: "/collection?lifestyle=suvs", icon: <TabIcon d="M3 15l2-6h14l2 6v3H3v-3Zm4 3v2m10-2v2M6 9l1.5-3h9L18 9" /> },
  { label: "Performance", href: "/collection?lifestyle=performance", icon: <TabIcon d="M12 21a9 9 0 1 1 9-9M12 12l5-5" /> },
  { label: "Sell Your Car", href: "/sell", icon: <TabIcon d="M4 7h16v10H4zM8 12h8M12 9v6" /> },
];

function TabIcon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

const menu = [
  { href: "/", label: "Home" },
  { href: "/collection", label: "The Collection" },
  { href: "/sell", label: "Sell Your Car" },
  { href: "/showroom", label: "Visit the Showroom" },
  { href: "/showroom#visit", label: "Book a Visit" },
  { href: "/shortlist", label: "Your Shortlist" },
];

type Dropdown = { label: string; mega?: boolean; items: { label: string; href: string; note?: string; muted?: boolean; art?: string; glyph?: string }[] };

function dropdowns(stock: { brand: string; count: number }[]): Dropdown[] {
  const counts = new Map(stock.map((b) => [b.brand, b.count]));
  const all = [...new Set([...brandDirectory, ...stock.map((b) => b.brand)])].sort((a, b) => a.localeCompare(b));
  const year = new Date().getFullYear();
  return [
    { label: "Price", mega: true, items: priceBands.map((b) => ({ label: b.label, glyph: "price", href: `/collection?${new URLSearchParams({ ...(b.min != null && { minPrice: String(b.min) }), ...(b.max != null && { maxPrice: String(b.max) }) })}` })) },
    { label: "Brand", mega: true, items: all.map((b) => ({ label: b, href: `/collection?brand=${encodeURIComponent(b)}`, note: counts.get(b) ? `${counts.get(b)} ${counts.get(b) === 1 ? "car" : "cars"}` : "Arriving soon", muted: !counts.get(b) })) },
    { label: "Category", mega: true, items: lifestyles.map((l) => ({ label: l.title, art: l.key, href: `/collection?lifestyle=${l.key}` })) },
    { label: "Fuel", mega: true, items: ["Petrol", "Diesel", "Hybrid", "Electric"].map((f) => ({ label: f, glyph: f, href: `/collection?fuel=${f}` })) },
    { label: "Year", mega: true, items: [year - 2, year - 3, year - 4, year - 5].map((y) => ({ label: `${y} & newer`, glyph: "year", href: `/collection?minYear=${y}` })) },
    { label: "KM Driven", mega: true, items: [10_000, 20_000, 30_000, 50_000].map((k) => ({ label: `Under ${k.toLocaleString("en-IN")} km`, glyph: "km", href: `/collection?maxKm=${k}` })) },
  ];
}

function HeaderSearch() {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  useEffect(() => setQ(params.get("q") ?? ""), [params]);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    router.push(q.trim() ? `/collection?q=${encodeURIComponent(q.trim())}` : "/collection");
  };
  return (
    <form className="hsearch" role="search" onSubmit={submit}>
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m20 20-4.6-4.6" /></svg>
      <label className="sr-only" htmlFor="hsearch">Search cars</label>
      <input id="hsearch" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by brand, model or body type" autoComplete="off" />
      <button type="submit" aria-label="Search">→</button>
    </form>
  );
}

function TabLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const current = `${pathname}${params.toString() ? `?${params}` : ""}`;
  return (
    <>
      {tabs.map((t) => (
        <Link key={t.label} href={t.href} className="htab" aria-current={current === t.href ? "page" : undefined} onClick={onNavigate}>
          {t.icon}
          <span>{t.label}</span>
        </Link>
      ))}
    </>
  );
}

export function Header({ brands: stock }: { brands: { brand: string; count: number }[] }) {
  const brands = stock.map((b) => b.brand);
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [drop, setDrop] = useState<string | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const openRef = useRef<HTMLButtonElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const items = dropdowns(stock);

  useEffect(() => {
    setOpen(false);
    setDrop(null);
  }, [pathname]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) setDrop(null);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    if (open) closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setDrop(null);
      if (open) {
        setOpen(false);
        openRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <header className="hdr">
        <div className="hdr__top">
          <Link href="/" className="wordmark hdr__logo" aria-label={`${dealership.name} — home`}>
            <span className="wordmark__name">{dealership.wordmark}</span>
            <span className="wordmark__desc">{dealership.descriptor}</span>
          </Link>
          <nav className="hdr__tabs" aria-label="Collections">
            <Suspense fallback={null}>
              <TabLinks />
            </Suspense>
          </nav>
          <div className="hdr__right">
            <Suspense fallback={<div className="hsearch" />}>
              <HeaderSearch />
            </Suspense>
            <button ref={openRef} type="button" className="hdr__menu" aria-expanded={open} aria-controls="site-menu" aria-label="Open menu" onClick={() => setOpen(true)}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M5 7h14M5 12h14M5 17h14" /></svg>
            </button>
          </div>
        </div>
        <div className="hdr__bar" ref={barRef}>
          <nav className="hdr__filters" aria-label="Explore by">
            <Link href="/collection" className="hdr__explore">Explore By</Link>
            {items.map((d) => (
              <div key={d.label} className="hdrop">
                <button type="button" className="hdrop__btn" aria-expanded={drop === d.label} onClick={() => setDrop(drop === d.label ? null : d.label)}>
                  {d.label} <span className="hdrop__caret" aria-hidden="true" />
                </button>
                {drop === d.label && d.mega && (
                  <div className="hmega">
                    <ul className={`hmega__grid ${d.items.some((i) => i.art || i.glyph) ? "hmega__grid--visual" : ""}`}>
                      {d.items.map((i) => (
                        <li key={i.label}>
                          <Link href={i.href} className={`hmega__tile ${i.muted ? "hmega__tile--muted" : ""} ${i.art || i.glyph ? "hmega__tile--visual" : ""}`} onClick={() => setDrop(null)}>
                            {i.art && <BodyArt kind={i.art} className="hmega__art" />}
                            {i.glyph && <Glyph kind={i.glyph} className="hmega__glyph" />}
                            <span className="hmega__name">{i.label}</span>
                            {i.note && <span className="hmega__note">{i.note}</span>}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {drop === d.label && !d.mega && (
                  <ul className="hdrop__menu">
                    {d.items.map((i) => (
                      <li key={i.label}>
                        <Link href={i.href} onClick={() => setDrop(null)}>{i.label}</Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </nav>
        </div>
      </header>

      <div id="site-menu" className={`menu ${open ? "menu--open" : ""}`} role="dialog" aria-modal="true" aria-label="Site menu" aria-hidden={!open} inert={!open}>
        <button ref={closeRef} type="button" className="menu__close" onClick={() => setOpen(false)}>
          Close <span aria-hidden="true" />
        </button>
        <div className="menu__main">
          <ul className="menu__list">
            {menu.map((m) => (
              <li key={m.href}>
                <Link href={m.href} onClick={() => setOpen(false)}>{m.label}</Link>
              </li>
            ))}
          </ul>
          <div className="menu__tabs">
            <Suspense fallback={null}>
              <TabLinks onNavigate={() => setOpen(false)} />
            </Suspense>
          </div>
          <div className="menu__meta">
            <div>
              <strong>Showroom</strong>
              {dealership.showroom.addressLines.join(", ")}
              <br />
              {dealership.showroom.city}
            </div>
            <div>
              <strong>Contact</strong>
              <a href={`tel:+${dealership.contact.phoneE164}`}>{dealership.contact.phone}</a>
              <br />
              <a href={`mailto:${dealership.contact.email}`}>{dealership.contact.email}</a>
            </div>
            <div>
              <strong>Hours</strong>
              {dealership.showroom.hours.map((h) => (
                <div key={h.days}>{h.days} · {h.time}</div>
              ))}
            </div>
          </div>
        </div>
        <aside className="menu__aside" aria-hidden="true">
          <Photo src={dealership.home.heroImage} alt="" shade />
          <div className="menu__aside-caption">
            <span className="eyebrow">Browse by brand</span>
            <div className="menu__brands">
              {brands.map((b) => (
                <Link key={b} href={`/collection?brand=${encodeURIComponent(b)}`} tabIndex={-1} onClick={() => setOpen(false)}>{b}</Link>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
