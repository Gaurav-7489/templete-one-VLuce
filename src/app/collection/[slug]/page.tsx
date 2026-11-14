import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BackToTop, DetailActions, ShareButton } from "@/components/DetailActions";
import { DetailGallery } from "@/components/DetailGallery";
import { WhatsApp } from "@/components/icons";
import { Stagger } from "@/components/motion/Stagger";
import { VehicleCard } from "@/components/VehicleCard";
import { dealership } from "@/config/dealership";
import { lifestyleTitle } from "@/data/catalog";
import { emi, formatKm, formatPrice, formatRupees, fullPrice, ownerLabel, vehicleTitle } from "@/lib/format";
import { getInventory, getVehicle, similarVehicles } from "@/lib/inventory";
import { siteUrl } from "@/lib/site";
import type { Vehicle } from "@/lib/types";
import { whatsappLink } from "@/lib/whatsapp";

export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams() {
  return (await getInventory()).map((v) => ({ slug: v.slug }));
}

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const v = await getVehicle((await params).slug);
  if (!v) return { title: "Vehicle not found" };
  const title = vehicleTitle(v);
  return {
    title,
    description: `${title} · ${formatKm(v.km)} · ${v.fuel} · ${v.transmission} · ${formatPrice(v.price)}. Available at ${dealership.name}, ${v.city}.`,
    alternates: { canonical: `/collection/${v.slug}` },
    openGraph: { title, images: v.images[0] ? [{ url: v.images[0] }] : undefined },
  };
}

/** Line icons for summary tiles and specification sections. */
const ic = {
  calendar: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4",
  car: "M3 15l2-5h14l2 5v3H3zM6 18v2M18 18v2M7 10l1.5-4h7L17 10",
  owner: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0",
  gear: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1",
  paint: "M4 20c4 0 4-4 8-4M14 4l6 6-8 8-6-6z",
  pin: "M12 21s-6-5.6-6-11a6 6 0 1 1 12 0c0 5.4-6 11-6 11Z",
  seat: "M8 3h5l1 9H8zM6 12h11l1 5H5zM7 17v4M16 17v4",
  axle: "M5 12h14M5 8v8M19 8v8",
  sliders: "M4 7h9M17 7h3M4 17h3M11 17h9M15 5v4M9 15v4",
  engine: "M4 9h3l2-3h6l2 3h3v8h-3l-2 2H9l-2-2H4z",
  bolt: "M13 2 5 14h6l-1 8 8-12h-6z",
  gauge: "M12 21a9 9 0 1 1 9-9M12 12l5-5",
  ext: "M3 15l2-5h14l2 5v3H3zM8 6h8",
  wheel: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.5 10H9M15 10h5.5M12 15v6",
  star: "M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z",
  doc: "M7 3h7l4 4v14H7zM14 3v4h4M10 12h5M10 16h5",
};
const Icon = ({ d, size = 22 }: { d: string; size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

function specSections(v: Vehicle) {
  const s = v.specs;
  const ev = v.fuel === "Electric" || v.fuel === "Hybrid";
  const sections: { id: string; title: string; icon: string; rows: [string, string | undefined][] }[] = [
    { id: "overview", title: "Overview", icon: ic.sliders, rows: [["Brand", v.brand], ["Model", v.model], ["Variant", v.variant], ["Registration year", String(v.year)], ["Kilometres driven", formatKm(v.km)], ["Ownership", ownerLabel(v.owners)], ["Stock ID", v.stockId]] },
    { id: "engine", title: "Engine & Transmission", icon: ic.gear, rows: [["Engine", s.engine], ["Power", s.power], ["Torque", s.torque], ["Transmission", v.transmission], ["Drivetrain", s.drivetrain], ["Fuel", v.fuel]] },
    ...(ev ? [{ id: "battery", title: v.fuel === "Electric" ? "Battery & Range" : "Hybrid System", icon: ic.bolt, rows: [["Battery", s.battery], ["Range", s.range], ["Powertrain", v.fuel === "Hybrid" ? s.engine : "Fully electric"]] as [string, string | undefined][] }] : []),
    { id: "performance", title: "Performance & Efficiency", icon: ic.gauge, rows: [["Acceleration", s.acceleration], ["Top speed", s.topSpeed]] },
    { id: "exterior", title: "Exterior", icon: ic.ext, rows: [["Body type", v.bodyType], ["Exterior colour", v.exterior]] },
    { id: "interior", title: "Interior & Seating", icon: ic.wheel, rows: [["Upholstery", v.interior], ["Seats", s.seats]] },
    { id: "features", title: "Features & Highlights", icon: ic.star, rows: v.highlights.map((h) => [h, "✓"] as [string, string]) },
    { id: "documents", title: "Registration & Documents", icon: ic.doc, rows: [["Registration state", v.registration], ["Location", v.city], ["Documents", "Please ask our team for the service history and documents for this car"]] },
  ];
  return sections.map((x) => ({ ...x, rows: x.rows.filter((r): r is [string, string] => !!r[1]) })).filter((x) => x.rows.length > 0);
}

export default async function VehiclePage({ params }: Params) {
  const v = await getVehicle((await params).slug);
  if (!v) notFound();
  const all = await getInventory();
  const related = similarVehicles(all, v, 3);
  const title = `${v.brand} ${v.model} ${v.variant}`;
  const fullTitle = vehicleTitle(v);
  const emiFrom = v.price ? emi(v.price * 0.7, 9.5, 60) : null;
  const waText = `Hello ${dealership.name}, I'm interested in the ${fullTitle} (${v.stockId}) — ${siteUrl}/collection/${v.slug}`;

  const summary = [
    { k: "Manufacturing Year", v: String(v.mfgYear ?? v.year), i: ic.calendar },
    { k: "Vehicle Type", v: v.bodyType || "—", i: ic.car },
    { k: "Ownership", v: ownerLabel(v.owners), i: ic.owner },
    { k: "Transmission", v: v.transmission, i: ic.gear },
    { k: "Exterior Colour", v: v.exterior || "—", i: ic.paint },
    { k: "Registration", v: v.registration ? `${v.registration} registered` : "Unregistered", i: ic.pin },
    ...(v.specs.seats ? [{ k: "Seats", v: v.specs.seats, i: ic.seat }] : []),
    ...(v.specs.drivetrain ? [{ k: "Drivetrain", v: v.specs.drivetrain, i: ic.axle }] : []),
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Car",
    name: fullTitle,
    brand: { "@type": "Brand", name: v.brand },
    model: v.model,
    vehicleConfiguration: v.variant,
    vehicleModelDate: String(v.year),
    mileageFromOdometer: { "@type": "QuantitativeValue", value: v.km, unitCode: "KMT" },
    fuelType: v.fuel,
    vehicleTransmission: v.transmission,
    color: v.exterior || undefined,
    bodyType: v.bodyType || undefined,
    numberOfPreviousOwners: v.owners,
    itemCondition: "https://schema.org/UsedCondition",
    image: [...v.images, ...(v.interiorImages ?? [])],
    sku: v.stockId,
    url: `${siteUrl}/collection/${v.slug}`,
    offers: v.price
      ? {
          "@type": "Offer",
          price: v.price,
          priceCurrency: "INR",
          availability: v.availability === "available" ? "https://schema.org/InStock" : v.availability === "reserved" ? "https://schema.org/LimitedAvailability" : "https://schema.org/PreOrder",
          seller: { "@type": "AutoDealer", name: dealership.name },
        }
      : undefined,
  };

  return (
    <div className="has-mobile-bar">
      <section className="dv">
        <div className="dv__wrap">
          <DetailGallery exterior={v.images} interior={v.interiorImages ?? []} title={`${v.year} ${v.brand} ${v.model}`} fileBase={v.slug} />

          <aside className="dp" id="enquire" aria-label="Vehicle summary">
            <div className="dp__top">
              <ol className="dp__crumbs" aria-label="Breadcrumb">
                <li><Link href="/">Home</Link></li>
                <li><Link href="/collection">Collection</Link></li>
                <li aria-current="page">{v.brand} {v.model}</li>
              </ol>
              <ShareButton title={fullTitle} />
            </div>
            <span className="dp__pill">
              Reg. Year : {v.year}
              {emiFrom ? <> | EMI starts @ {formatRupees(emiFrom)}</> : null}
            </span>
            <h1 className="dp__title">{title}</h1>
            <div className="dp__price num">
              {fullPrice(v.price)}
              {v.availability === "reserved" && <span className="dp__status">Booked</span>}
              {v.availability === "coming-soon" && <span className="dp__status dp__status--soon">Arriving soon</span>}
            </div>
            <ul className="lcard__specs dp__specs">
              <li className="num"><Icon d="M5 21V4m0 0h11l-2 4 2 4H5" size={18} />{formatKm(v.km)}</li>
              <li><Icon d="M12 3c3 4 6 7.2 6 10.5A6 6 0 0 1 6 13.5C6 10.2 9 7 12 3Z" size={18} />{v.fuel}</li>
              <li><Icon d={ic.pin} size={18} />{v.registration ?? "Unreg"}</li>
            </ul>
            <DetailActions slug={v.slug} stockId={v.stockId} title={fullTitle} price={v.price} reservable={v.availability === "available"} />
            <a className="dp__wa" href={whatsappLink(waText)} target="_blank" rel="noopener">
              <WhatsApp width={18} height={18} /> Chat on WhatsApp
            </a>

            <div className="dp__summary">
              <h2 className="lined">Car Summary</h2>
              <div className="sumgrid">
                {summary.map((s) => (
                  <div key={s.k} className="sumtile">
                    <Icon d={s.i} size={34} />
                    <span className="sumtile__k">{s.k}</span>
                    <span className="sumtile__v">{s.v}</span>
                  </div>
                ))}
              </div>
              {v.lifestyle.length > 0 && (
                <div className="dp__tags">
                  {v.lifestyle.map((l) => (
                    <Link key={l} href={`/collection?lifestyle=${l}`} className="lchip lchip--link">{lifestyleTitle(l)}</Link>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      </section>

      <section className="fullspec">
        <div className="wrap">
          <h2 className="fullspec__title">Full Specification</h2>
          {v.description && <p className="fullspec__lead">{v.description}</p>}
          <div className="acc">
            {specSections(v).map((sec, i) => (
              <details key={sec.id} className="acc__item" open={i === 0}>
                <summary>
                  <Icon d={sec.icon} />
                  <span>{sec.title}</span>
                  <svg className="acc__chev" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
                </summary>
                <dl className="acc__rows">
                  {sec.rows.map(([k, val]) => (
                    <div key={k}><dt>{k}</dt><dd>{val}</dd></div>
                  ))}
                </dl>
              </details>
            ))}
          </div>
          <p className="fullspec__note">Specifications are manufacturer figures for this model. Please confirm the exact specification of this car with our team.</p>
        </div>
      </section>

      {related.length > 0 && (
        <section className="related">
          <div className="wrap">
            <h2 className="lined lined--lg">Related Cars</h2>
            <Stagger className="lgrid lgrid--flush">
              {related.map((s) => <VehicleCard key={s.slug} v={s} />)}
            </Stagger>
          </div>
        </section>
      )}

      <div className="mobile-bar">
        <a className="btn" href={whatsappLink(waText)} target="_blank" rel="noopener"><WhatsApp width={16} height={16} /> WhatsApp</a>
        <a className="btn btn--ghost" href="#enquire">Enquire</a>
      </div>
      <BackToTop />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </div>
  );
}
