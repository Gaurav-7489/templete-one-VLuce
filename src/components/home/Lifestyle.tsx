import Link from "next/link";
import { lifestyles } from "@/data/catalog";
import { Photo } from "../Photo";
import { Reveal } from "../Reveal";

export function LifestyleIndex({ counts }: { counts: Record<string, number> }) {
  return (
    <section className="section" aria-labelledby="lifestyle-title">
      <div className="wrap">
        <div className="head">
          <Reveal>
            <span className="eyebrow">04 — Explore by Lifestyle</span>
            <h2 id="lifestyle-title" className="display h-xl head__title">
              However <em>you drive.</em>
            </h2>
          </Reveal>
          <Reveal className="head__aside" delay={0.15}>
            <p className="lead">From quiet electric saloons to two-door sports cars, discover the collection by the way you live.</p>
          </Reveal>
        </div>
        <div className="lifestyle">
          {lifestyles.map((l, i) => {
            const n = counts[l.key] ?? 0;
            const body = (
              <>
                <Photo src={l.image} alt="" label={l.title} />
                <div className="life__body">
                  <div>
                    <span className="eyebrow eyebrow--plain">{l.line}</span>
                    <h3 className="life__title">{l.title}</h3>
                  </div>
                  <span className="life__count num">{n ? `${String(n).padStart(2, "0")} cars` : "Arriving soon"}</span>
                </div>
              </>
            );
            return (
              <Reveal key={l.key} image delay={(i % 3) * 0.08} className="life" as={n ? undefined : "div"}>
                {n ? (
                  <Link href={`/collection?lifestyle=${l.key}`} style={{ position: "absolute", inset: 0 }} aria-label={`${l.title}: ${n} cars`}>
                    {body}
                  </Link>
                ) : (
                  body
                )}
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
