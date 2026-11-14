import Link from "next/link";
import { dealership } from "@/config/dealership";
import { Arrow } from "../icons";
import { Photo } from "../Photo";

export function Hero({ count }: { count: number }) {
  const h = dealership.home;
  return (
    <section className="hero" aria-label="Introduction">
      <div className="hero__media">
        {h.heroVideo ? (
          <div className="photo">
            <video src={h.heroVideo} poster={h.heroImage} autoPlay muted loop playsInline aria-hidden="true" />
          </div>
        ) : (
          <Photo src={h.heroImage} alt="A luxury sports car photographed in low evening light" priority />
        )}
      </div>
      <div className="hero__content">
        <div className="wrap hero__grid">
          <div>
            <span className="eyebrow fade-up" style={{ animationDelay: ".3s" }}>{h.heroEyebrow}</span>
            <h1 className="display h-xxl hero__title">
              <span className="line"><span>{h.heroTitle[0]}</span></span>
              <span className="line"><span><em>{h.heroTitle[1]}</em></span></span>
            </h1>
            <p className="lead fade-up" style={{ animationDelay: ".55s", marginTop: 28 }}>{h.heroLead}</p>
            <div className="hero__actions fade-up" style={{ animationDelay: ".7s" }}>
              <Link href="/collection" className="btn">Explore Collection <Arrow /></Link>
              <Link href="/showroom" className="btn btn--ghost">Visit Showroom</Link>
            </div>
          </div>
          <div className="hero__aside fade-up" style={{ animationDelay: "1s" }}>
            <span className="num">{String(count).padStart(2, "0")} automobiles in the collection</span>
            <span className="hero__scroll">Scroll <i /></span>
          </div>
        </div>
      </div>
    </section>
  );
}
