import Link from "next/link";
import { dealership } from "@/config/dealership";
import { Arrow } from "../icons";
import { Photo } from "../Photo";
import { Reveal } from "../Reveal";

export function SellTeaser() {
  return (
    <section className="section section--light" aria-labelledby="sell-title">
      <div className="wrap split split--wide-media">
        <Reveal image className="split__media">
          <Photo src={dealership.home.sellImage} alt="A luxury car parked in soft daylight" label="Sell your car" />
        </Reveal>
        <div>
          <Reveal>
            <span className="eyebrow">05 — Sell Your Car</span>
            <h2 id="sell-title" className="display h-lg head__title">
              Your next chapter <em>starts here.</em>
            </h2>
            <p className="lead" style={{ marginTop: 24 }}>
              Thinking of selling or exchanging your car? Tell us about it, and our team will be in touch to arrange a viewing at a time that suits you.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <ol className="steps">
              <li><b>01</b><div><strong>Share the details</strong><span>Make, model, year and kilometres — two minutes online.</span></div></li>
              <li><b>02</b><div><strong>Meet our team</strong><span>We arrange a viewing at the showroom or at your address.</span></div></li>
              <li><b>03</b><div><strong>Decide in your time</strong><span>Receive an offer and choose whether to sell or exchange.</span></div></li>
            </ol>
            <Link href="/sell" className="btn btn--dark">Start a selling enquiry <Arrow /></Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
