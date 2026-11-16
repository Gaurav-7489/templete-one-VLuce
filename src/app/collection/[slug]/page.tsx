import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EmiCalculator } from "@/components/EmiCalculator";
import { EnquiryForm } from "@/components/EnquiryForm";
import { TrackView } from "@/components/Analytics";
import { breadcrumbJsonLd, ldScript, vehicleJsonLd } from "@/lib/seo";
import { Gallery } from "@/components/Gallery";
import { WhatsApp } from "@/components/icons";
import { Reveal } from "@/components/Reveal";
import { SaveButton } from "@/components/SaveButton";
import { AvailabilityBadge, VehicleCard } from "@/components/VehicleCard";
import { dealership } from "@/config/dealership";
import { lifestyleTitle } from "@/data/catalog";
import { formatKm, formatPrice, ownerLabel, vehicleTitle } from "@/lib/format";
import { getInventory, getVehicle, similarVehicles } from "@/lib/inventory";
import { siteUrl } from "@/lib/site";
import type { VehicleSpecs } from "@/lib/types";
import { telLink, whatsappLink } from "@/lib/whatsapp";

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
  const where = v.availability === "reserved" ? "Reserved at" : v.availability === "coming-soon" ? "Arriving soon at" : "Available at";
  const description = `${title} · ${formatKm(v.km)} · ${v.fuel} · ${v.transmission} · ${formatPrice(v.price)}. ${where} ${dealership.name}, ${v.city}.`;
  return {
    title,
    description,
    alternates: { canonical: `/collection/${v.slug}` },
    openGraph: { type: "website", title, description, url: `/collection/${v.slug}`, images: v.images[0] ? [{ url: v.images[0] }] : undefined },
    twitter: { card: "summary_large_image", title, description },
  };
}

const specLabels: Record<keyof VehicleSpecs, string> = {
  engine: "Engine",
  power: "Power",
  torque: "Torque",
  acceleration: "Acceleration",
  topSpeed: "Top speed",
  drivetrain: "Drivetrain",
  seats: "Seats",
  battery: "Battery",
  range: "Range",
};

export default async function VehiclePage({ params }: Params) {
  const v = await getVehicle((await params).slug);
  if (!v) notFound();
  const all = await getInventory();
  const similar = similarVehicles(all.filter((o) => o.availability !== "sold"), v, 3);
  const title = vehicleTitle(v);
  const short = `${v.brand} ${v.model}`;
  const waText = `Hello ${dealership.name}, I'm interested in the ${title} (${v.stockId}) — ${siteUrl}/collection/${v.slug}`;

  const facts = [
    { k: "Year", v: String(v.year) },
    { k: "Kilometres", v: formatKm(v.km) },
    { k: "Fuel", v: v.fuel },
    { k: "Transmission", v: v.transmission },
  ];
  const details = [
    ["Ownership", ownerLabel(v.owners)],
    ["Body", v.bodyType],
    ["Exterior", v.exterior],
    ["Interior", v.interior],
    ["Registration", v.registration ? `${v.registration} registered` : ""],
    ["Location", v.city],
    ["Stock ID", v.stockId],
  ].filter(([, val]) => val) as [string, string][];
  const specs = (Object.keys(specLabels) as (keyof VehicleSpecs)[]).filter((k) => v.specs[k]).map((k) => [specLabels[k], v.specs[k]!] as const);

  const jsonLd = [vehicleJsonLd(v, title), breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Collection", path: "/collection" }, { name: v.brand, path: `/collection?brand=${encodeURIComponent(v.brand)}` }, { name: title, path: `/collection/${v.slug}` }])];

  return (
    <div className="has-mobile-bar" data-stock-id={v.stockId}>
      <TrackView stockId={v.stockId} />
      <section className="vd-hero">
        <div className="wrap">
          <ol className="crumbs" aria-label="Breadcrumb">
            <li><Link href="/">Home</Link></li>
            <li><Link href="/collection">Collection</Link></li>
            <li><Link href={`/collection?brand=${encodeURIComponent(v.brand)}`}>{v.brand}</Link></li>
            <li aria-current="page">{v.model}</li>
          </ol>
          <Gallery images={v.images} title={`${v.year} ${short}`} />
        </div>
      </section>

      <div className="wrap vd">
        <div>
          <Reveal>
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <AvailabilityBadge v={v} />
              {v.lifestyle.map((l) => (
                <Link key={l} href={`/collection?lifestyle=${l}`} className="badge badge--light">{lifestyleTitle(l)}</Link>
              ))}
            </div>
            <h1 className="display h-xl vd__title">
              <span className="muted" style={{ display: "block", fontSize: ".32em", letterSpacing: ".02em", marginBottom: ".4em" }}>{v.year} · {v.brand}</span>
              {v.model}
            </h1>
            <p className="vd__variant">{v.variant}</p>
            <dl className="keyfacts">
              {facts.map((f) => (
                <div key={f.k}><dt>{f.k}</dt><dd className="num">{f.v}</dd></div>
              ))}
            </dl>
          </Reveal>

          {v.description && (
            <Reveal className="vd__section">
              <h2>Overview</h2>
              <p className="lead" style={{ maxWidth: "40em" }}>{v.description}</p>
            </Reveal>
          )}

          {v.highlights.length > 0 && (
            <Reveal className="vd__section">
              <h2>Highlights</h2>
              <ul className="highlights">
                {v.highlights.map((h) => <li key={h}>{h}</li>)}
              </ul>
            </Reveal>
          )}

          {specs.length > 0 && (
            <Reveal className="vd__section">
              <h2>Performance &amp; specification</h2>
              <dl className="spec-table">
                {specs.map(([k, val]) => (
                  <div key={k}><dt>{k}</dt><dd>{val}</dd></div>
                ))}
              </dl>
              <p className="muted" style={{ fontSize: 12.5, marginTop: 16 }}>Manufacturer figures for this model. Please confirm the exact specification of this car with our team.</p>
            </Reveal>
          )}

          <Reveal className="vd__section">
            <h2>Vehicle details</h2>
            <dl className="spec-table">
              {details.map(([k, val]) => (
                <div key={k}><dt>{k}</dt><dd>{val}</dd></div>
              ))}
            </dl>
          </Reveal>

          {v.price && (
            <Reveal className="vd__section">
              <h2>Finance estimate</h2>
              <EmiCalculator price={v.price} />
            </Reveal>
          )}
        </div>

        <aside className="vd__aside" id="enquire" aria-label="Enquire about this vehicle">
          <div className="panel">
            <span className="eyebrow eyebrow--plain">{v.availability === "coming-soon" ? "Register interest" : "Asking price"}</span>
            <div className="panel__price num">{formatPrice(v.price)}</div>
            <span className="panel__note">{v.availability === "reserved" ? "Currently reserved — join the waiting list." : "Excludes registration transfer and insurance."}</span>
            <div className="panel__actions">
              <a className="btn" href={whatsappLink(waText)} target="_blank" rel="noopener"><WhatsApp width={16} height={16} /> WhatsApp</a>
              <a className="btn btn--ghost" href={telLink()}>Call</a>
            </div>
            <EnquiryForm kind="vehicle" vehicle={{ stockId: v.stockId, title }} defaultIntent={v.availability === "available" ? "test-drive" : "call"} submitLabel={v.availability === "available" ? "Request a viewing" : "Register interest"} />
            <div style={{ marginTop: 20, display: "flex", justifyContent: "center" }}>
              <SaveButton slug={v.slug} title={short} inline />
            </div>
          </div>
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="section section--tight">
          <div className="wrap">
            <div className="head">
              <h2 className="duo">You May Also Like <b>Similar Cars</b></h2>
              <Link href="/collection" className="btn btn--sm">Explore All</Link>
            </div>
            <div className="results">
              {similar.map((s) => <VehicleCard key={s.slug} v={s} />)}
            </div>
          </div>
        </section>
      )}

      <div className="mobile-bar dark">
        <a className="btn" href={whatsappLink(waText)} target="_blank" rel="noopener"><WhatsApp width={16} height={16} /> WhatsApp</a>
        <a className="btn btn--ghost" href="#enquire">Enquire</a>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={ldScript(jsonLd)} />
    </div>
  );
}
