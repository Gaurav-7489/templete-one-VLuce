"use client";

import Link from "next/link";
import { formatKm, fullPrice, ownerLabel } from "@/lib/format";
import type { Vehicle } from "@/lib/types";
import { Photo } from "./Photo";
import { useCompare } from "./shortlist";

const rows: [string, (v: Vehicle) => string | undefined][] = [
  ["Price", (v) => fullPrice(v.price)],
  ["Registration year", (v) => String(v.year)],
  ["Kilometres", (v) => formatKm(v.km)],
  ["Fuel", (v) => v.fuel],
  ["Transmission", (v) => v.transmission],
  ["Ownership", (v) => ownerLabel(v.owners)],
  ["Body type", (v) => v.bodyType],
  ["Engine", (v) => v.specs.engine],
  ["Power", (v) => v.specs.power],
  ["Torque", (v) => v.specs.torque],
  ["0–100 km/h", (v) => v.specs.acceleration?.replace(/^0–100 km\/h in /, "")],
  ["Top speed", (v) => v.specs.topSpeed],
  ["Range", (v) => v.specs.range],
  ["Drivetrain", (v) => v.specs.drivetrain],
  ["Seats", (v) => v.specs.seats],
  ["Exterior", (v) => v.exterior],
  ["Interior", (v) => v.interior],
  ["Registration", (v) => v.registration ?? "Unregistered"],
];

export function CompareView({ vehicles }: { vehicles: Vehicle[] }) {
  const { list, remove, clear } = useCompare();
  const cars = list.map((s) => vehicles.find((v) => v.slug === s)).filter((v): v is Vehicle => !!v);
  if (!cars.length)
    return (
      <div className="lempty" style={{ marginBottom: 96 }}>
        <h2>No cars to compare yet.</h2>
        <p>Open any car and choose “Compare Car” to add it here.</p>
        <Link href="/collection" className="btn">Browse the collection</Link>
      </div>
    );
  return (
    <div className="cmp">
      <table>
        <thead>
          <tr>
            <th scope="col"><button type="button" className="lclear" onClick={clear}>Clear all</button></th>
            {cars.map((v) => (
              <th key={v.slug} scope="col">
                <div className="cmp__media"><Photo src={v.images[0]} alt="" label={`${v.brand} ${v.model}`} /></div>
                <Link href={`/collection/${v.slug}`} className="cmp__name">{v.brand} {v.model} {v.variant}</Link>
                <button type="button" className="lclear" onClick={() => remove(v.slug)}>Remove</button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, get]) => (
            <tr key={label}>
              <th scope="row">{label}</th>
              {cars.map((v) => <td key={v.slug}>{get(v) || "—"}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
