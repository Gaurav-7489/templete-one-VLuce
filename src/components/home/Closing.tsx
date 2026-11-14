import Link from "next/link";
import { whatsappLink } from "@/lib/whatsapp";
import { Arrow, WhatsApp } from "../icons";
import { Reveal } from "../Reveal";

export function Closing() {
  return (
    <section className="cta-band" aria-labelledby="closing-title">
      <div className="wrap">
        <Reveal>
          <span className="eyebrow eyebrow--plain">Begin the conversation</span>
          <h2 id="closing-title" className="display h-xl" style={{ marginTop: 24 }}>
            The right car <em>is worth the wait.</em>
          </h2>
        </Reveal>
        <Reveal delay={0.15} className="cta-band__actions">
          <Link href="/collection" className="btn">Explore Collection <Arrow /></Link>
          <a href={whatsappLink("Hello, I'm looking for a specific car. Can you help?")} target="_blank" rel="noopener" className="btn btn--ghost">
            <WhatsApp width={16} height={16} /> Find me a car
          </a>
        </Reveal>
      </div>
    </section>
  );
}
