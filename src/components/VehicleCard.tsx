import Link from "next/link";
import { dealership } from "@/config/dealership";
import { availabilityLabel, formatKm, formatPriceFull, vehicleTitle } from "@/lib/format";
import { siteUrl } from "@/lib/site";
import type { Vehicle } from "@/lib/types";
import { whatsappLink } from "@/lib/whatsapp";
import { FuelPump, Odometer, Phone, Plate, WhatsApp } from "./icons";
import { Photo } from "./Photo";
import { SaveButton } from "./SaveButton";

export function AvailabilityBadge({ v }: { v: Pick<Vehicle, "availability"> }) {
  return <span className={`badge badge--${v.availability}`}>{availabilityLabel[v.availability]}</span>;
}

export function VehicleCard({ v, priority }: { v: Vehicle; priority?: boolean }) {
  const title = `${v.brand} ${v.model}`;
  const href = `/collection/${v.slug}`;
  const wa = `Hello ${dealership.name}, I'm interested in the ${vehicleTitle(v)} (${v.stockId}) — ${siteUrl}${href}`;
  return (
    <article className="card">
      <div className="card__top">
        <div className="card__badges">
          <span className="badge">Reg.Year : {v.year}</span>
          {v.availability !== "available" && <AvailabilityBadge v={v} />}
        </div>
        <h3 className="card__title">
          <Link href={href}>{title} {v.variant}</Link>
        </h3>
        <span className="card__price num">{formatPriceFull(v.price)}</span>
      </div>
      <div className="card__media">
        <Photo src={v.images[0]} alt={`${v.year} ${title} ${v.variant}`} label={title} priority={priority} />
      </div>
      <dl className="card__facts">
        <div><Odometer /><dt>Kilometers Driven</dt><dd className="num">{formatKm(v.km)}</dd></div>
        <div><FuelPump /><dt>Fuel / Gas Type</dt><dd>{v.fuel}</dd></div>
        <div><Plate /><dt>{v.registration ? "Registration State" : "Transmission"}</dt><dd>{v.registration ?? v.transmission}</dd></div>
      </dl>
      <div className="card__actions">
        <Link href={`${href}#enquire`} className="card__cta"><Phone /> Request A Call Back</Link>
        <a href={whatsappLink(wa)} target="_blank" rel="noopener" className="card__wa" aria-label={`WhatsApp us about the ${title}`}><WhatsApp /></a>
      </div>
      <span className="card__save"><SaveButton slug={v.slug} title={title} /></span>
    </article>
  );
}
