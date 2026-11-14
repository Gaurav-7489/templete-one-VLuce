"use client";

import Link from "next/link";
import { useState } from "react";
import { dealership } from "@/config/dealership";
import { availabilityLabel, formatKm, fullPrice, vehicleTitle } from "@/lib/format";
import type { Vehicle } from "@/lib/types";
import { telLink, whatsappLink } from "@/lib/whatsapp";
import { Chevron, WhatsApp } from "./icons";
import { Photo } from "./Photo";
import { SaveButton } from "./SaveButton";

export function AvailabilityBadge({ v }: { v: Pick<Vehicle, "availability"> }) {
  return <span className={`badge badge--${v.availability}`}>{availabilityLabel[v.availability]}</span>;
}


const Ico = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);
const icons = {
  km: "M5 21V4m0 0h11l-2 4 2 4H5",
  fuel: "M12 3c3 4 6 7.2 6 10.5A6 6 0 0 1 6 13.5C6 10.2 9 7 12 3Z",
  pin: "M12 21s-6-5.6-6-11a6 6 0 1 1 12 0c0 5.4-6 11-6 11Zm0-9a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",
  phone: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z",
};

/** Photo shapes for the free-flowing masonry grid. Each car keeps the same shape everywhere it appears. */
const shapes = ["4 / 5", "1 / 1", "5 / 4", "3 / 4", "4 / 3", "4 / 5", "1 / 1", "2 / 3"];
const shapeFor = (slug: string) => shapes[[...slug].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % shapes.length];

/** Listing card: registration year, title and price on top; large photo carousel with quick contact; key specs below. */
export function VehicleCard({ v, priority }: { v: Vehicle; priority?: boolean }) {
  const [i, setI] = useState(0);
  const imgs = v.images.length ? v.images : [""];
  const n = imgs.length;
  const title = `${v.brand} ${v.model} ${v.variant}`;
  const href = `/collection/${v.slug}`;
  const step = (d: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    setI((x) => (x + d + n) % n);
  };
  return (
    <article className="lcard">
      <div className="lcard__head">
        <span className="lcard__reg">Reg. Year : {v.year}</span>
        <h3 className="lcard__title">
          <Link href={href}>{title}</Link>
        </h3>
        <div className="lcard__price num">{fullPrice(v.price)}</div>
      </div>
      <div className="lcard__media" style={{ aspectRatio: shapeFor(v.slug) }}>
        {imgs.map((src, k) => (
          <div key={k} className="lcard__slide" style={{ opacity: k === i ? 1 : 0 }} aria-hidden={k !== i}>
            {(k === i || k === (i + 1) % n || k === (i - 1 + n) % n) && <Photo src={src || undefined} alt={k === i ? vehicleTitle(v) : ""} label={`${v.brand} ${v.model}`} priority={priority && k === 0} />}
          </div>
        ))}
        {v.availability === "reserved" && <span className="lcard__ribbon">Booked</span>}
        {v.availability === "coming-soon" && <span className="lcard__ribbon lcard__ribbon--soon">Arriving soon</span>}
        {v.km < 1000 && <span className="lcard__tag">New car</span>}
        {n > 1 && (
          <>
            <button type="button" className="lcard__nav lcard__nav--prev" onClick={step(-1)} aria-label="Previous photo"><Chevron dir="left" /></button>
            <button type="button" className="lcard__nav lcard__nav--next" onClick={step(1)} aria-label="Next photo"><Chevron /></button>
          </>
        )}
        <span className="lcard__count num">{String(i + 1).padStart(2, "0")}/{String(n).padStart(2, "0")}</span>
        <div className="lcard__acts">
          <a className="lcard__act" href={telLink()} aria-label={`Call ${dealership.name} about this car`}><Ico d={icons.phone} /></a>
          <a className="lcard__act lcard__act--wa" href={whatsappLink(`Hello, I'm interested in the ${vehicleTitle(v)} (${v.stockId}).`)} target="_blank" rel="noopener" aria-label="Enquire on WhatsApp"><WhatsApp /></a>
        </div>
      </div>
      <ul className="lcard__specs">
        <li className="num"><Ico d={icons.km} />{formatKm(v.km)}</li>
        <li><Ico d={icons.fuel} />{v.fuel}</li>
        <li><Ico d={icons.pin} />{v.registration ?? "Unreg"}</li>
      </ul>
      <span className="lcard__save" style={{ top: 22, right: 26 }}><SaveButton slug={v.slug} title={`${v.brand} ${v.model}`} /></span>
    </article>
  );
}
