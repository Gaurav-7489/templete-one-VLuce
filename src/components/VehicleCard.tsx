import Link from "next/link";
import { availabilityLabel, formatKm, formatPrice } from "@/lib/format";
import type { Vehicle } from "@/lib/types";
import { Arrow } from "./icons";
import { Photo } from "./Photo";
import { SaveButton } from "./SaveButton";

export function AvailabilityBadge({ v }: { v: Pick<Vehicle, "availability"> }) {
  return <span className={`badge badge--${v.availability}`}>{availabilityLabel[v.availability]}</span>;
}

export function VehicleCard({ v, priority }: { v: Vehicle; priority?: boolean }) {
  const title = `${v.brand} ${v.model}`;
  return (
    <article className="card">
      <Link href={`/collection/${v.slug}`} className="card" aria-label={`${v.year} ${title} ${v.variant}, ${formatPrice(v.price)}`}>
        <div className="card__media">
          <Photo src={v.images[0]} alt={`${v.year} ${title} ${v.variant}`} label={title} priority={priority} />
          <span className="card__badge"><AvailabilityBadge v={v} /></span>
          <span className="card__view">View vehicle <Arrow /></span>
        </div>
        <div className="card__body">
          <span className="card__brand">{v.brand} · {v.year}</span>
          <h3 className="card__title">{v.model}</h3>
          <span className="card__variant">{v.variant}</span>
          <span className="card__price num">{formatPrice(v.price)}</span>
          <ul className="card__specs">
            <li>{v.fuel}</li>
            <li className="num">{formatKm(v.km)}</li>
            <li>{v.transmission}</li>
          </ul>
        </div>
      </Link>
      <span className="card__save"><SaveButton slug={v.slug} title={title} /></span>
    </article>
  );
}
