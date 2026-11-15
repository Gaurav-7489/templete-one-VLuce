import type { Metadata } from "next";
import { faqJsonLd, ldScript, showroomFaq } from "@/lib/seo";
import { EnquiryForm } from "@/components/EnquiryForm";
import { Photo } from "@/components/Photo";
import { Reveal } from "@/components/Reveal";
import { directionsUrl, mapEmbedUrl, ShowroomInfo } from "@/components/ShowroomInfo";
import { dealership } from "@/config/dealership";

export const metadata: Metadata = {
  title: "Showroom & Contact",
  description: `Visit ${dealership.showroom.name}. ${dealership.showroom.addressLines.join(", ")}, ${dealership.showroom.city}. Opening hours, directions and appointments.`,
  alternates: { canonical: "/showroom" },
};

const faq = showroomFaq();

export default function ShowroomPage() {
  return (
    <>
      <section className="hero dark" style={{ height: "min(52svh, 520px)", minHeight: 360 }}>
        <div className="hero__media">
          <Photo src={dealership.showroom.image} alt={dealership.showroom.name} priority label={dealership.showroom.name} />
        </div>
        <div className="hero__content">
          <div className="wrap">
            <span className="eyebrow" style={{ color: "#fff" }}>{dealership.showroom.name}</span>
            <h1 className="display h-xl hero__title">
              <span className="line">Come and see</span>
              <span className="line"><em>for yourself.</em></span>
            </h1>
          </div>
        </div>
      </section>

      <section className="section section--light">
        <div className="wrap split" style={{ alignItems: "start" }}>
          <Reveal className="showroom-card">
            <div>
              <span className="eyebrow">Visit</span>
              <h2 className="display h-lg head__title">{dealership.showroom.city}</h2>
            </div>
            <ShowroomInfo />
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <a href={directionsUrl()} target="_blank" rel="noopener" className="btn btn--dark">Get directions</a>
              <a href={`tel:+${dealership.contact.phoneE164}`} className="btn btn--ghost">Call the showroom</a>
            </div>
          </Reveal>
          <Reveal delay={0.1} image className="map">
            <iframe title={`Map of ${dealership.showroom.name}`} src={mapEmbedUrl()} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          </Reveal>
        </div>
      </section>

      <section className="section" id="visit">
        <div className="wrap split" style={{ alignItems: "start" }}>
          <Reveal>
            <span className="eyebrow">Book a visit</span>
            <h2 className="display h-lg head__title">A private viewing, <em>at your time.</em></h2>
            <p className="lead" style={{ marginTop: 24 }}>
              Tell us when you would like to visit and which cars interest you. We will confirm your appointment and have them ready.
            </p>
          </Reveal>
          <Reveal delay={0.1} className="sell-panel">
            <EnquiryForm kind="visit" withVisit submitLabel="Request appointment" idPrefix="visit" />
          </Reveal>
        </div>
      </section>

      <section className="section section--light" aria-labelledby="faq-h">
        <div className="wrap faq">
          <h2 className="display h-lg head__title" id="faq-h">Good to know</h2>
          <dl>
            {faq.map((f) => (
              <div key={f.q} className="faq__item">
                <dt>{f.q}</dt>
                <dd>{f.a}</dd>
              </div>
            ))}
          </dl>
        </div>
        <script type="application/ld+json" dangerouslySetInnerHTML={ldScript(faqJsonLd(faq))} />
      </section>
    </>
  );
}
