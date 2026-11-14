"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { dealership } from "@/config/dealership";
import { Photo } from "./Photo";
import { useShortlist } from "./shortlist";

const nav = [
  { href: "/collection", label: "Collection" },
  { href: "/sell", label: "Sell Your Car" },
  { href: "/showroom", label: "Showroom" },
];

const menu = [
  { href: "/", label: "Home" },
  { href: "/collection", label: "The Collection" },
  { href: "/collection?lifestyle=electric", label: "Electric" },
  { href: "/sell", label: "Sell Your Car" },
  { href: "/showroom", label: "Visit the Showroom" },
  { href: "/shortlist", label: "Your Shortlist" },
];

export function Header({ brands }: { brands: string[] }) {
  const pathname = usePathname();
  const [solid, setSolid] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const last = useRef(0);
  const { list } = useShortlist();
  const closeRef = useRef<HTMLButtonElement>(null);
  const openRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setSolid(y > 40);
      const hide = y > 480 && y > last.current + 4;
      const show = y < last.current - 4 || y < 480;
      if (hide) setHidden(true);
      else if (show) setHidden(false);
      last.current = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("header-visible", !hidden);
  }, [hidden]);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    if (open) closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        setOpen(false);
        openRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const active = (href: string) => (pathname === href || (href !== "/" && pathname.startsWith(href)) ? "page" : undefined);

  return (
    <>
      <header className={`header ${solid ? "header--solid" : ""} ${hidden && !open ? "header--hidden" : ""}`}>
        <div className="wrap header__inner">
          <nav className="header__nav" aria-label="Primary">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} aria-current={active(n.href)}>
                {n.label}
              </Link>
            ))}
          </nav>
          <Link href="/" className="wordmark" aria-label={`${dealership.name} — home`}>
            <span className="wordmark__name">{dealership.wordmark}</span>
            <span className="wordmark__desc">{dealership.descriptor}</span>
          </Link>
          <div className="header__util">
            <a className="hide-md" href={`tel:+${dealership.contact.phoneE164}`}>
              {dealership.contact.phone}
            </a>
            <Link className="hide-md" href="/shortlist" aria-label={`Shortlist, ${list.length} saved`}>
              Shortlist{list.length > 0 && <span className="shortlist-count">{list.length}</span>}
            </Link>
            <button ref={openRef} type="button" className="menu-btn" aria-expanded={open} aria-controls="site-menu" onClick={() => setOpen(true)}>
              Menu <span className="menu-btn__lines" aria-hidden="true" />
            </button>
          </div>
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
                <Link href={m.href} onClick={() => setOpen(false)}>
                  {m.label}
                </Link>
              </li>
            ))}
          </ul>
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
                <div key={h.days}>
                  {h.days} · {h.time}
                </div>
              ))}
            </div>
          </div>
        </div>
        <aside className="menu__aside" aria-hidden="true">
          <Photo src={dealership.home.heroImage} alt="" label={dealership.wordmark} shade />
          <div className="menu__aside-caption">
            <span className="eyebrow">Browse by marque</span>
            <div className="menu__brands">
              {brands.map((b) => (
                <Link key={b} href={`/collection?brand=${encodeURIComponent(b)}`} tabIndex={-1} onClick={() => setOpen(false)}>
                  {b}
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
