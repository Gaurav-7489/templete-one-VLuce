import Link from "next/link";
import { Arrow } from "../icons";
import { Reveal } from "../Reveal";

/** Brands with listings link to a filtered collection; configured brands with no stock show as "arriving soon" and are not links. */
export function BrandIndex({ brands }: { brands: { brand: string; count: number }[] }) {
  return (
    <section className="section section--light" aria-labelledby="brands-title">
      <div className="wrap">
        <div className="head">
          <Reveal>
            <span className="eyebrow">02 — Explore by Marque</span>
            <h2 id="brands-title" className="display h-xl head__title">
              The houses <em>we keep.</em>
            </h2>
          </Reveal>
          <Reveal className="head__aside" delay={0.15}>
            <p className="lead">Browse the collection by manufacturer.</p>
          </Reveal>
        </div>
        <Reveal className="brands">
          {brands.map(({ brand, count }) =>
            count > 0 ? (
              <Link key={brand} href={`/collection?brand=${encodeURIComponent(brand)}`} className="brand">
                <span className="brand__top">
                  <span>Marque</span>
                  <span className="num">{String(count).padStart(2, "0")} {count === 1 ? "car" : "cars"}</span>
                </span>
                <span className="brand__name">{brand} <Arrow /></span>
              </Link>
            ) : (
              <div key={brand} className="brand brand--empty" aria-label={`${brand}: no vehicles currently available`}>
                <span className="brand__top"><span>Marque</span><span>Arriving soon</span></span>
                <span className="brand__name">{brand}</span>
              </div>
            ),
          )}
        </Reveal>
      </div>
    </section>
  );
}
