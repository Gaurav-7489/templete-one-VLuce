import { dealership } from "@/config/dealership";
import { Photo } from "../Photo";
import { Reveal } from "../Reveal";

/** Trust section. Makes no claims about certifications, warranties or awards — add only dealer-provided, verifiable statements. */
const pillars = [
  { t: "A considered selection", d: "We choose each car for its history, condition and specification, and tell you what we know about it." },
  { t: "Unhurried viewings", d: "Private appointments, time behind the wheel, and every question answered in person." },
  { t: "Expert guidance", d: "Help with finance, insurance, transfer and exchange from a team that knows these cars." },
  { t: "A proper handover", d: "Your car is prepared, explained and handed over with the care the moment deserves." },
];

export function Experience() {
  const imgs = dealership.home.experienceImages;
  return (
    <section className="section section--ink2" aria-labelledby="experience-title">
      <div className="wrap">
        <div className="head">
          <Reveal>
            <span className="eyebrow">06 — The Dealership Experience</span>
            <h2 id="experience-title" className="display h-xl head__title">
              Unhurried. <em>Personal.</em>
            </h2>
          </Reveal>
          <Reveal className="head__aside" delay={0.15}>
            <p className="lead">Buying a special car should feel special. Ours is a showroom built around conversation, not pressure.</p>
          </Reveal>
        </div>
        <div className="mosaic">
          {imgs.map((src, i) => (
            <Reveal key={src} image delay={i * 0.1}>
              <Photo src={src} alt="" label={dealership.wordmark} />
            </Reveal>
          ))}
        </div>
        <div className="pillars">
          {pillars.map((p, i) => (
            <Reveal key={p.t} className="pillar" delay={i * 0.08}>
              <span className="pillar__n num">0{i + 1}</span>
              <h3>{p.t}</h3>
              <p>{p.d}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
