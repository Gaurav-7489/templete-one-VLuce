"use client";

import Link from "next/link";
import { useState } from "react";
import { EmiCalculator } from "./EmiCalculator";
import { EnquiryForm } from "./EnquiryForm";
import { Modal } from "./Modal";
import { useCompare } from "./shortlist";

const I = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
);

/** EMI calculator, compare and reserve actions for a vehicle. */
export function DetailActions({ slug, stockId, title, price, reservable }: { slug: string; stockId: string; title: string; price: number | null; reservable: boolean }) {
  const [emi, setEmi] = useState(false);
  const [reserve, setReserve] = useState(false);
  const { has, toggle, list } = useCompare();
  const inCompare = has(slug);
  return (
    <>
      <div className="dp__btns">
        <button type="button" className="dp__btn" onClick={() => setEmi(true)} disabled={!price}>
          <I d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM9 15l6-6M9.5 9.5h.01M14.5 14.5h.01" /> EMI Calculator
        </button>
        <button type="button" className="dp__btn" aria-pressed={inCompare} onClick={() => toggle(slug)}>
          <I d="M4 5h7v14H4zM13 9h7v10h-7zM7.5 9v6M16.5 12v4" /> {inCompare ? "Added to Compare" : "Compare Car"}
        </button>
      </div>
      {inCompare && list.length > 1 && (
        <Link href="/compare" className="dp__compare-link">Compare {list.length} cars →</Link>
      )}
      <button type="button" className="dp__reserve" onClick={() => setReserve(true)}>
        <I d="M6 4h12v16l-6-4-6 4z" /> {reservable ? "Reserve Your Car" : "Register Interest"}
      </button>

      <Modal open={emi} onClose={() => setEmi(false)} title="EMI Calculator">
        {price && <EmiCalculator price={price} />}
      </Modal>
      <Modal open={reserve} onClose={() => setReserve(false)} title={reservable ? "Reserve Your Car" : "Register Interest"}>
        <p className="muted" style={{ marginTop: 0, fontSize: 14 }}>{title}. Our team will call you to confirm availability and the reservation process.</p>
        <EnquiryForm kind="vehicle" vehicle={{ stockId, title }} defaultIntent="call" submitLabel={reservable ? "Request reservation" : "Register interest"} idPrefix="reserve" />
      </Modal>
    </>
  );
}

export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="dp__share"
      aria-label="Share this car"
      onClick={async () => {
        const url = location.href;
        try {
          if (navigator.share) await navigator.share({ title, url });
          else {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
          }
        } catch {
          /* dismissed */
        }
      }}
    >
      {copied ? <span style={{ fontSize: 11 }}>Copied</span> : <I d="M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm12 7a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />}
    </button>
  );
}

export function BackToTop() {
  return (
    <button type="button" className="totop" aria-label="Back to top" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
      <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M12 20V4m0 0-6 6m6-6 6 6" /></svg>
    </button>
  );
}
