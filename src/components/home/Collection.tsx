import Link from "next/link";
import type { Vehicle } from "@/lib/types";
import { Arrow } from "../icons";
import { Reveal } from "../Reveal";
import { VehicleCard } from "../VehicleCard";

export function CollectionPreview({ vehicles, total }: { vehicles: Vehicle[]; total: number }) {
  return (
    <section className="section theme-light" aria-labelledby="collection-title">
      <div className="wrap">
        <div className="head">
          <Reveal>
            <span className="eyebrow">01 — Discover the Collection</span>
            <h2 id="collection-title" className="display h-xl head__title">
              Chosen one <em>at a time.</em>
            </h2>
          </Reveal>
          <Reveal className="head__aside" delay={0.15}>
            <p className="lead">Every car in our showroom is selected for its history, its specification and the way it drives.</p>
            <Link href="/collection" className="link">View all {total} vehicles <Arrow /></Link>
          </Reveal>
        </div>
        <div className="lgrid" style={{ paddingBottom: 0 }}>
          {vehicles.map((v, i) => (
            <Reveal key={v.slug} delay={(i % 3) * 0.08}>
              <VehicleCard v={v} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
