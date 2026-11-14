import Link from "next/link";
import { Photo } from "@/components/Photo";
import { Reveal } from "@/components/Reveal";
import { directionsUrl, ShowroomInfo } from "@/components/ShowroomInfo";
import { VehicleCard } from "@/components/VehicleCard";
import { dealership } from "@/config/dealership";
import { brandOrder, lifestyles } from "@/data/catalog";
import { applyFilters } from "@/lib/filters";
import { formatKm, formatPriceFull, vehicleTitle } from "@/lib/format";
import { getInventory } from "@/lib/inventory";

export const revalidate = 300;

const experience = [
  { title: "Inspected, not just listed", text: "Every car is checked mechanically and cosmetically before it joins the collection." },
  { title: "Clear paperwork", text: "Ownership, service history and registration transfer are handled with you, step by step." },
  { title: "Delivered with care", text: "Collect from the showroom, or have your car delivered to your door." },
];

export default async function Home() {
  const all = applyFilters(await getInventory(), {});
  const featured = all.find((v) => v.featured && v.availability === "available") ?? all[0];
  const recent = all.filter((v) => v.availability !== "coming-soon").slice(0, 6);

  const counts = new Map<string, number>();
  for (const v of all) counts.set(v.brand, (counts.get(v.brand) ?? 0) + 1);
  const brands = [...counts].map(([brand, count]) => ({ brand, count })).sort((a, b) => (brandOrder.indexOf(a.brand) + 1 || 99) - (brandOrder.indexOf(b.brand) + 1 || 99));
  const lifeCounts: Record<string, number> = {};
  for (const v of all) for (const l of v.lifestyle) lifeCounts[l] = (lifeCounts[l] ?? 0) + 1;
  const cats = lifestyles.filter((l) => lifeCounts[l.key]);

  return (
    <>
      <section className="hero dark">
        <div className="hero__media">
          <Photo src={dealership.home.heroImage} alt="" priority label={dealership.wordmark} />
        </div>
        <div className="hero__content">
          <div className="wrap">
            <span className="eyebrow" style={{ color: "#fff" }}>{dealership.home.heroEyebrow}</span>
            <h1 className="display h-xxl hero__title">
              <span className="line">{dealership.home.heroTitle[0]}</span>
              <span className="line"><em>{dealership.home.heroTitle[1]}</em></span>
            </h1>
            <p className="lead">{dealership.home.heroLead}</p>
            <div className="hero__actions">
              <Link href="/collection" className="btn">Explore All</Link>
              <Link href="/sell" className="btn btn--ghost">Sell Your Car</Link>
            </div>
          </div>
        </div>
      </section>

      {all.length > 0 && (
        <section className="section section--light section--tight">
          <div className="wrap">
            <div className="head">
              <h2 className="duo">You May Also Like <b>Explore Top Choices</b></h2>
              <p className="lead">{dealership.description}</p>
            </div>
            <h3 className="subhead" style={{ marginTop: 0 }}>Top Brands</h3>
            <div className="brand-chips">
              {brands.map((b) => (
                <Link key={b.brand} href={`/collection?brand=${encodeURIComponent(b.brand)}`}>{b.brand} <span className="num">{b.count}</span></Link>
              ))}
            </div>
            {cats.length > 0 && (
              <>
                <h3 className="subhead">Top Categories</h3>
                <div className="cats">
                  {cats.map((l) => (
                    <Link key={l.key} href={`/collection?lifestyle=${l.key}`} className="cat">
                      <Photo src={l.image} alt="" label={l.title} shade />
                      <span className="cat__label">{l.title}<span>{lifeCounts[l.key]} {lifeCounts[l.key] === 1 ? "car" : "cars"}</span></span>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {recent.length > 0 && (
        <section className="section">
          <div className="wrap">
            <div className="head">
              <h2 className="duo">Recently Added <b>Cars to the Garage.</b></h2>
              <Link href="/collection" className="btn btn--sm">Explore All</Link>
            </div>
            <div className="results">
              {recent.map((v, i) => <VehicleCard key={v.slug} v={v} priority={i < 3} />)}
            </div>
          </div>
        </section>
      )}

      {featured && (
        <section className="band dark">
          <div className="band__media">
            <Photo src={featured.images[1] ?? featured.images[0]} alt="" label={featured.model} />
          </div>
          <div className="wrap band__content">
            <span className="eyebrow" style={{ color: "#fff" }}>Car of the week</span>
            <h2 className="display h-lg" style={{ marginTop: 10 }}>
              {featured.year} {featured.brand}
              <br />
              <em>{featured.model} {featured.variant}</em>
            </h2>
            <p className="lead">{featured.description || `${vehicleTitle(featured)}, available now at our ${dealership.showroom.city} showroom.`}</p>
            <div className="hero__actions">
              <Link href={`/collection/${featured.slug}`} className="btn">View This Car</Link>
            </div>
            <div className="stats">
              <div><b className="num">{featured.year}</b><span>Registration<strong>Year</strong></span></div>
              <div><b className="num">{formatKm(featured.km).replace(" km", "")}</b><span>Kilometers<strong>Driven</strong></span></div>
              <div><b>{featured.fuel}</b><span>{featured.transmission}<strong>{featured.specs.power ?? featured.bodyType ?? "Drivetrain"}</strong></span></div>
              <div><b className="num" style={{ fontSize: "clamp(22px, 2.4vw, 34px)", lineHeight: 1.5 }}>{formatPriceFull(featured.price)}</b><span>Asking<strong>Price</strong></span></div>
            </div>
          </div>
        </section>
      )}

      <section className="section section--light">
        <div className="wrap">
          <div className="head">
            <h2 className="duo">Let&rsquo;s Explore <b>The {dealership.wordmark} Experience</b></h2>
            <p className="lead">Beyond the showroom floor. The same standard applies to how each car is chosen, prepared and handed over.</p>
          </div>
          <div className="tiles">
            {experience.map((e, i) => (
              <Reveal key={e.title} delay={i * 0.08} className="tile">
                <div className="tile__media"><Photo src={dealership.home.experienceImages[i]} alt="" label={dealership.wordmark} /></div>
                <h3>{e.title}</h3>
                <p>{e.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="band dark">
        <div className="band__media">
          <Photo src={dealership.home.sellImage} alt="" label="Sell your car" />
        </div>
        <div className="wrap band__content">
          <span className="eyebrow" style={{ color: "#fff" }}>Sell or exchange</span>
          <h2 className="display h-lg" style={{ marginTop: 10 }}>Where Your Car Meets <br /><em>Its Next Owner</em></h2>
          <p className="lead">Share a few details and our team will call with an offer. Sell outright, or exchange towards a car from the collection.</p>
          <div className="hero__actions">
            <Link href="/sell" className="btn">Sell Your Car</Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap split" style={{ alignItems: "start" }}>
          <div className="showroom-card">
            <h2 className="duo">Our Showroom <b>{dealership.showroom.city}</b></h2>
            <p className="lead">Visit us to see the collection in person. Tell us which cars interest you and we will have them ready.</p>
            <ShowroomInfo />
            <div className="hero__actions" style={{ marginTop: 0 }}>
              <Link href="/showroom#visit" className="btn">Book a Visit</Link>
              <a href={directionsUrl()} target="_blank" rel="noopener" className="btn btn--ghost">Get Directions</a>
            </div>
          </div>
          <Reveal image className="map"><Photo src={dealership.showroom.image} alt={dealership.showroom.name} label={dealership.showroom.name} /></Reveal>
        </div>
      </section>
    </>
  );
}
