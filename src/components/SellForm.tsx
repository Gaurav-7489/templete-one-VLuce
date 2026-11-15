"use client";

import { useState, type FormEvent } from "react";
import { dealership } from "@/config/dealership";
import { brandOrder } from "@/data/catalog";
import { Arrow } from "./icons";
import { postEnquiry, Received, useSubmissionKey, type SubmitState } from "./EnquiryForm";

const years = Array.from({ length: 20 }, (_, i) => new Date().getFullYear() - i);
const steps = ["Your car", "Its history", "Your details"];

/** Three-step selling enquiry. Values persist across steps; validation runs on the server too. */
export function SellForm() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Record<string, string>>({});
  const [state, setState] = useState<SubmitState>({ status: "idle" });
  const [key, renewKey] = useSubmissionKey();
  const [local, setLocal] = useState<Record<string, string>>({});
  const f = { ...local, ...(state.fields ?? {}) };
  const set = (k: string) => (e: { target: { value: string } }) => setData((d) => ({ ...d, [k]: e.target.value }));

  const checkStep = (s: number) => {
    const errs: Record<string, string> = {};
    if (s === 0) {
      if (!data.brand) errs["sell.brand"] = "Please tell us the make.";
      if (!data.model?.trim()) errs["sell.model"] = "Please tell us the model.";
      if (!data.year) errs["sell.year"] = "Please choose the model year.";
    }
    if (s === 1 && !(Number(data.km) >= 0 && data.km)) errs["sell.km"] = "Please enter the kilometres driven.";
    setLocal(errs);
    return Object.keys(errs).length === 0;
  };

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (step < 2) {
      if (checkStep(step)) setStep(step + 1);
      return;
    }
    const d = new FormData(e.currentTarget);
    setState({ status: "sending" });
    const result = await postEnquiry({
      kind: "sell",
      name: d.get("name"),
      phone: d.get("phone"),
      email: d.get("email"),
      message: d.get("message"),
      sell: { brand: data.brand, model: data.model, variant: data.variant, year: data.year, km: data.km, owners: data.owners, city: data.city, expectedPrice: data.expectedPrice },
      consent: d.get("consent") === "on",
      marketing: false,
      website: d.get("website"),
    }, key);
    if (result.status === "done") renewKey();
    if (result.status === "error" && result.fields && Object.keys(result.fields).some((k) => k.startsWith("sell."))) {
      setStep(Object.keys(result.fields).some((k) => k === "sell.km") ? 1 : 0);
    }
    setState(result);
  }

  if (state.status === "done") return <Received state={state} whatsappText={`Hello ${dealership.name}, I'd like to sell my ${data.year} ${data.brand} ${data.model}.`} />;

  const err = (k: string) => (f[k] ? <span className="field__error" role="alert">{f[k]}</span> : null);
  const cls = (k: string) => `field ${f[k] ? "field--error" : ""}`;

  return (
    <form className="form" onSubmit={onSubmit} noValidate>
      <div className="stepper" aria-hidden="true">
        {steps.map((s, i) => <span key={s} data-done={i <= step} />)}
      </div>
      <p className="eyebrow eyebrow--plain" style={{ margin: 0 }}>Step {step + 1} of 3 — {steps[step]}</p>

      {step === 0 && (
        <>
          <div className="form__row">
            <div className={cls("sell.brand")}>
              <label htmlFor="s-brand">Make</label>
              <select id="s-brand" value={data.brand ?? ""} onChange={set("brand")} required>
                <option value="" disabled>Select</option>
                {[...brandOrder, "Other"].map((b) => <option key={b}>{b}</option>)}
              </select>
              {err("sell.brand")}
            </div>
            <div className={cls("sell.model")}>
              <label htmlFor="s-model">Model</label>
              <input id="s-model" value={data.model ?? ""} onChange={set("model")} placeholder="e.g. X5" required />
              {err("sell.model")}
            </div>
          </div>
          <div className="form__row">
            <div className="field">
              <label htmlFor="s-variant">Variant <span style={{ textTransform: "none", letterSpacing: 0 }}>(optional)</span></label>
              <input id="s-variant" value={data.variant ?? ""} onChange={set("variant")} placeholder="e.g. xDrive40i M Sport" />
            </div>
            <div className={cls("sell.year")}>
              <label htmlFor="s-year">Model year</label>
              <select id="s-year" value={data.year ?? ""} onChange={set("year")} required>
                <option value="" disabled>Select</option>
                {years.map((y) => <option key={y}>{y}</option>)}
              </select>
              {err("sell.year")}
            </div>
          </div>
        </>
      )}

      {step === 1 && (
        <>
          <div className="form__row">
            <div className={cls("sell.km")}>
              <label htmlFor="s-km">Kilometres driven</label>
              <input id="s-km" inputMode="numeric" value={data.km ?? ""} onChange={(e) => setData((d) => ({ ...d, km: e.target.value.replace(/\D/g, "") }))} placeholder="e.g. 24000" required />
              {err("sell.km")}
            </div>
            <div className="field">
              <label htmlFor="s-owners">Owners</label>
              <select id="s-owners" value={data.owners ?? ""} onChange={set("owners")}>
                <option value="">Select</option>
                <option value="1">1st owner</option>
                <option value="2">2nd owner</option>
                <option value="3">3rd owner or more</option>
              </select>
            </div>
          </div>
          <div className="form__row">
            <div className="field">
              <label htmlFor="s-city">City of registration</label>
              <input id="s-city" value={data.city ?? ""} onChange={set("city")} placeholder={dealership.showroom.city} />
            </div>
            <div className="field">
              <label htmlFor="s-price">Expected price, ₹ <span style={{ textTransform: "none", letterSpacing: 0 }}>(optional)</span></label>
              <input id="s-price" inputMode="numeric" value={data.expectedPrice ?? ""} onChange={(e) => setData((d) => ({ ...d, expectedPrice: e.target.value.replace(/\D/g, "") }))} />
            </div>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <div className={cls("name")}>
            <label htmlFor="s-name">Name</label>
            <input id="s-name" name="name" autoComplete="name" required />
            {err("name")}
          </div>
          <div className="form__row">
            <div className={cls("phone")}>
              <label htmlFor="s-phone">Mobile</label>
              <input id="s-phone" name="phone" type="tel" autoComplete="tel" required placeholder="+91" />
              {err("phone")}
            </div>
            <div className={cls("email")}>
              <label htmlFor="s-email">Email <span style={{ textTransform: "none", letterSpacing: 0 }}>(optional)</span></label>
              <input id="s-email" name="email" type="email" autoComplete="email" />
              {err("email")}
            </div>
          </div>
          <div className="field">
            <label htmlFor="s-msg">Anything else we should know? <span style={{ textTransform: "none", letterSpacing: 0 }}>(optional)</span></label>
            <textarea id="s-msg" name="message" rows={3} maxLength={600} placeholder="Service history, accessories, exchange interest…" />
          </div>
          <div className="hp" aria-hidden="true"><input name="website" tabIndex={-1} autoComplete="off" /></div>
          <label className="check">
            <input type="checkbox" name="consent" required />
            <span>{dealership.consentText}</span>
          </label>
          {err("consent")}
        </>
      )}

      {state.status === "error" && state.message && <p className="form-error" role="alert">{state.message}</p>}
      <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
        {step > 0 && <button type="button" className="btn btn--ghost" onClick={() => setStep(step - 1)}>Back</button>}
        <button type="submit" className="btn" style={{ flex: 1 }} disabled={state.status === "sending"}>
          {step < 2 ? "Continue" : state.status === "sending" ? "Sending…" : "Submit enquiry"} <Arrow />
        </button>
      </div>
    </form>
  );
}
