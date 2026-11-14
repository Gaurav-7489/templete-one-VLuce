import Link from "next/link";
import { directionsUrl } from "@/components/ShowroomInfo";
import { dealership } from "@/config/dealership";
import { lifestyles } from "@/data/catalog";
import { ArrowUpRight } from "./icons";

export function Footer({ brands }: { brands: string[] }) {
  const year = new Date().getFullYear();
  const s = dealership.showroom;
  return (
    <footer className="footer dark">
      <div className="wrap">
        <div className="footer__cols">
          <div>
            <h3>{dealership.wordmark} World</h3>
            <ul>
              <li><Link href="/collection">The Collection</Link></li>
              <li><Link href="/sell">Sell Your Car</Link></li>
              <li><Link href="/showroom">Our Showroom</Link></li>
              <li><Link href="/showroom#visit">Book a Visit</Link></li>
              <li><Link href="/shortlist">Your Shortlist</Link></li>
            </ul>
          </div>
          <div>
            <h3>Styles</h3>
            <ul>
              {lifestyles.map((l) => (
                <li key={l.key}><Link href={`/collection?lifestyle=${l.key}`}>{l.title}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h3>Brands</h3>
            <ul>
              {brands.slice(0, 9).map((b) => (
                <li key={b}><Link href={`/collection?brand=${encodeURIComponent(b)}`}>{b}</Link></li>
              ))}
            </ul>
          </div>
          <div className="footer__about">
            <Link href="/" className="wordmark">
              <span className="wordmark__name">{dealership.wordmark}</span>
              <span className="wordmark__desc">{dealership.descriptor}</span>
            </Link>
            <p>{dealership.description}</p>
          </div>
        </div>

        <div className="footer__contacts">
          <div><strong>Buy Car</strong><a href={`tel:+${dealership.contact.phoneE164}`}>{dealership.contact.phone}</a></div>
          <div><strong>Sell Your Car</strong><Link href="/sell">Start a valuation</Link></div>
          <div><strong>WhatsApp</strong><a href={`https://wa.me/${dealership.contact.whatsappE164}`} target="_blank" rel="noopener">Chat with us</a></div>
          <div><strong>Email</strong><a href={`mailto:${dealership.contact.email}`}>{dealership.contact.email}</a></div>
        </div>

        <div className="footer__label">Our Showroom</div>
        <div className="footer__rooms">
          <div>
            <strong>{s.city}</strong>
            {s.addressLines.join(", ")}, {s.city}, {s.region} - {s.postalCode}
            <br />
            <a href={directionsUrl()} target="_blank" rel="noopener" aria-label={`Directions to ${s.name}`}><ArrowUpRight /></a>
          </div>
          <div>
            <strong>Opening hours</strong>
            {s.hours.map((h) => (
              <span key={h.days} style={{ display: "block" }}>{h.days} · {h.time}</span>
            ))}
          </div>
        </div>

        <div className="footer__social">
          <p><strong>Follow {dealership.name}</strong>New arrivals, every week.</p>
          <div>
            {dealership.social.map((x) => (
              <a key={x.label} href={x.href} target="_blank" rel="noopener">{x.label}</a>
            ))}
          </div>
        </div>

        <div className="footer__bottom">
          <span>Copyright ©{year} {dealership.name} &nbsp;|&nbsp; Prices, specifications and availability are subject to change.</span>
          {dealership.showStudioCredit && <span>Website by VandLabs Studio</span>}
        </div>
      </div>
    </footer>
  );
}
