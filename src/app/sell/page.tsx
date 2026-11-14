import type { Metadata } from "next";
import { Photo } from "@/components/Photo";
import { Reveal } from "@/components/Reveal";
import { SellForm } from "@/components/SellForm";
import { dealership } from "@/config/dealership";

export const metadata: Metadata = {
  title: "Sell Your Car",
  description: `Sell or exchange your car with ${dealership.name}. Share the details online and our team will arrange a viewing.`,
  alternates: { canonical: "/sell" },
};

export default function SellPage() {
  return (
    <>
      <section className="hero" style={{ height: "78svh", minHeight: 560 }}>
        <div className="hero__media">
          <Photo src={dealership.home.sellImage} alt="A luxury car parked in soft daylight" priority label="Sell your car" />
        </div>
        <div className="hero__content">
          <div className="wrap">
            <span className="eyebrow fade-up">Sell or Exchange</span>
            <h1 className="display h-xl hero__title">
              <span className="line"><span>Your next chapter</span></span>
              <span className="line"><span><em>starts here.</em></span></span>
            </h1>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="wrap split" style={{ alignItems: "start" }}>
          <Reveal>
            <span className="eyebrow">How it works</span>
            <h2 className="display h-lg head__title">A simple, <em>respectful</em> process.</h2>
            <p className="lead" style={{ marginTop: 24 }}>
              Tell us about your car. A member of our team will call you to discuss it, arrange a viewing, and share an offer. There is no obligation to proceed.
            </p>
            <ol className="steps">
              <li><b>01</b><div><strong>Share the details</strong><span>Make, model, year and kilometres.</span></div></li>
              <li><b>02</b><div><strong>Arrange a viewing</strong><span>At our {dealership.showroom.city} showroom, or at a place that suits you.</span></div></li>
              <li><b>03</b><div><strong>Receive an offer</strong><span>Sell outright, or exchange towards a car from the collection.</span></div></li>
            </ol>
          </Reveal>
          <Reveal delay={0.1} className="sell-panel">
            <SellForm />
          </Reveal>
        </div>
      </section>
    </>
  );
}
