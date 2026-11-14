import Link from "next/link";
import { dealership } from "@/config/dealership";

export function Footer({ brands }: { brands: string[] }) {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer__top">
          <div>
            <Link href="/" className="wordmark" style={{ alignItems: "flex-start" }}>
              <span className="wordmark__name">{dealership.wordmark}</span>
              <span className="wordmark__desc">{dealership.descriptor}</span>
            </Link>
            <p className="muted" style={{ maxWidth: 360, marginTop: 28 }}>
              {dealership.description}
            </p>
          </div>
          <div>
            <h3>Collection</h3>
            <ul>
              <li><Link href="/collection">All vehicles</Link></li>
              {brands.slice(0, 6).map((b) => (
                <li key={b}><Link href={`/collection?brand=${encodeURIComponent(b)}`}>{b}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h3>Services</h3>
            <ul>
              <li><Link href="/sell">Sell your car</Link></li>
              <li><Link href="/showroom#visit">Book a visit</Link></li>
              <li><Link href="/shortlist">Your shortlist</Link></li>
              <li><Link href="/showroom">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h3>Showroom</h3>
            <ul>
              <li className="muted">
                {dealership.showroom.addressLines.join(", ")}, {dealership.showroom.city} {dealership.showroom.postalCode}
              </li>
              <li><a href={`tel:+${dealership.contact.phoneE164}`}>{dealership.contact.phone}</a></li>
              <li><a href={`mailto:${dealership.contact.email}`}>{dealership.contact.email}</a></li>
              <li style={{ display: "flex", gap: 18, marginTop: 8 }}>
                {dealership.social.map((s) => (
                  <a key={s.label} href={s.href} target="_blank" rel="noopener">{s.label}</a>
                ))}
              </li>
            </ul>
          </div>
        </div>
        <div className="footer__giant" aria-hidden="true">{dealership.wordmark}</div>
        <div className="footer__bottom">
          <span>© {year} {dealership.name}. All rights reserved.</span>
          <span>Prices, specifications and availability are subject to change. Please confirm details with the showroom.</span>
          {dealership.showStudioCredit && <span>Crafted by VandLabs Studio</span>}
        </div>
      </div>
    </footer>
  );
}
