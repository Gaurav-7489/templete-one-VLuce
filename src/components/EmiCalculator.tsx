"use client";

import { useMemo, useState } from "react";
import { formatRupees } from "@/lib/format";

/** Standard reducing-balance EMI. Indicative only; the rate is a placeholder the visitor can change. */
export function emi(principal: number, annualRatePct: number, months: number) {
  if (principal <= 0 || months <= 0) return 0;
  const r = annualRatePct / 12 / 100;
  if (r === 0) return principal / months;
  const f = Math.pow(1 + r, months);
  return (principal * r * f) / (f - 1);
}

export function EmiCalculator({ price }: { price: number }) {
  const [down, setDown] = useState(30);
  const [rate, setRate] = useState(9.5);
  const [months, setMonths] = useState(48);
  const loan = price * (1 - down / 100);
  const monthly = useMemo(() => emi(loan, rate, months), [loan, rate, months]);
  return (
    <div className="emi">
      <div className="emi__grid">
        <div className="range">
          <div className="range__top"><label htmlFor="emi-down">Down payment</label><b className="num">{down}% · {formatRupees(price * down / 100)}</b></div>
          <input id="emi-down" type="range" min={10} max={90} step={5} value={down} onChange={(e) => setDown(+e.target.value)} />
        </div>
        <div className="range">
          <div className="range__top"><label htmlFor="emi-rate">Interest rate (p.a.)</label><b className="num">{rate.toFixed(1)}%</b></div>
          <input id="emi-rate" type="range" min={7} max={16} step={0.25} value={rate} onChange={(e) => setRate(+e.target.value)} />
        </div>
        <div className="range">
          <div className="range__top"><label htmlFor="emi-months">Tenure</label><b className="num">{months} months</b></div>
          <input id="emi-months" type="range" min={12} max={84} step={12} value={months} onChange={(e) => setMonths(+e.target.value)} />
        </div>
        <div className="emi__result">
          <span className="muted" style={{ fontSize: 13 }}>Estimated monthly payment</span>
          <strong className="num">{formatRupees(monthly)}</strong>
        </div>
        <p className="muted" style={{ fontSize: 12, margin: 0 }}>
          Indicative only, for a loan of {formatRupees(loan)}. Actual rates and eligibility are set by the lender; ask our team for a finance quote.
        </p>
      </div>
    </div>
  );
}
