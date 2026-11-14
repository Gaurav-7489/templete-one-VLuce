import Link from "next/link";
import { dealership } from "@/config/dealership";
import { Arrow } from "../icons";
import { Photo } from "../Photo";
import { Reveal } from "../Reveal";
import { directionsUrl, ShowroomInfo } from "../ShowroomInfo";

export function ShowroomTeaser() {
  return (
    <section className="section section--light" aria-labelledby="showroom-title">
      <div className="wrap split">
        <div className="showroom-card">
          <Reveal>
            <span className="eyebrow">07 — Our Showroom</span>
            <h2 id="showroom-title" className="display h-lg head__title">
              {dealership.showroom.city}, <em>by appointment or by chance.</em>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <ShowroomInfo />
          </Reveal>
          <Reveal delay={0.2} style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            <Link href="/showroom#visit" className="btn btn--dark">Book a visit <Arrow /></Link>
            <a href={directionsUrl()} target="_blank" rel="noopener" className="btn btn--ghost-dark">Get directions</a>
          </Reveal>
        </div>
        <Reveal image className="split__media">
          <Photo src={dealership.showroom.image} alt={`${dealership.showroom.name}`} label={dealership.showroom.name} />
        </Reveal>
      </div>
    </section>
  );
}
