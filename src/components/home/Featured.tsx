import Link from "next/link";
import { formatKm, formatPrice } from "@/lib/format";
import type { Vehicle } from "@/lib/types";
import { Arrow } from "../icons";
import { Parallax } from "../Parallax";
import { Photo } from "../Photo";
import { Reveal } from "../Reveal";

export function Featured({ v }: { v: Vehicle }) {
  const facts = [
    v.specs.power && { k: "Power", v: v.specs.power },
    v.specs.acceleration && { k: "0–100 km/h", v: v.specs.acceleration.replace(/^0–100 km\/h in /, "") },
    { k: "Odometer", v: formatKm(v.km) },
    { k: "Price", v: formatPrice(v.price) },
  ].filter(Boolean) as { k: string; v: string }[];
  return (
    <section className="feature" aria-labelledby="feature-title">
      <Parallax className="feature__media" strength={0.1}>
        <Photo src={v.images[0]} alt={`${v.year} ${v.brand} ${v.model} ${v.variant}`} label={`${v.brand} ${v.model}`} />
      </Parallax>
      <div className="feature__content wrap">
        <Reveal>
          <span className="eyebrow">03 — Featured Automobile · {v.brand}</span>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 id="feature-title" className="feature__model">{v.model}</h2>
        </Reveal>
        <div className="feature__row">
          <Reveal delay={0.2}>
            <p className="h-sm" style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 300 }}>
              {v.year} · {v.variant} <span className="muted">— {v.exterior}</span>
            </p>
            <p className="lead" style={{ marginTop: 14 }}>{v.description}</p>
            <div style={{ marginTop: 32 }}>
              <Link href={`/collection/${v.slug}`} className="btn">Explore this {v.model} <Arrow /></Link>
            </div>
          </Reveal>
          <Reveal delay={0.3}>
            <dl className="spec-strip">
              {facts.map((f) => (
                <div key={f.k}>
                  <dt>{f.k}</dt>
                  <dd className="num">{f.v}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
