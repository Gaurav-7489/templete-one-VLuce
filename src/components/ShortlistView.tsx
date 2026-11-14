"use client";

import Link from "next/link";
import { dealership } from "@/config/dealership";
import { formatPrice, vehicleTitle } from "@/lib/format";
import type { Vehicle } from "@/lib/types";
import { whatsappLink } from "@/lib/whatsapp";
import { WhatsApp } from "./icons";
import { useShortlist } from "./shortlist";
import { VehicleCard } from "./VehicleCard";

export function ShortlistView({ vehicles }: { vehicles: Vehicle[] }) {
  const { list, clear } = useShortlist();
  const saved = list.map((s) => vehicles.find((v) => v.slug === s)).filter((v): v is Vehicle => !!v);
  if (!saved.length)
    return (
      <div className="empty">
        <h2>Nothing saved yet<span>Tap the heart on any car to keep it here</span></h2>
        <p>Your shortlist is stored only in this browser.</p>
        <Link href="/collection" className="btn">Explore All</Link>
      </div>
    );
  const text = `Hello ${dealership.name}, I'd like to view these cars:\n${saved.map((v) => `• ${vehicleTitle(v)} (${v.stockId}) — ${formatPrice(v.price)}`).join("\n")}`;
  return (
    <>
      <div className="results-head">
        <span className="num">{saved.length} saved</span>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <a className="btn btn--sm" href={whatsappLink(text)} target="_blank" rel="noopener"><WhatsApp width={14} height={14} /> Send to the showroom</a>
          <button type="button" className="btn btn--sm btn--ghost" onClick={clear}>Clear</button>
        </div>
      </div>
      <div className="results">
        {saved.map((v) => <VehicleCard key={v.slug} v={v} />)}
      </div>
    </>
  );
}
