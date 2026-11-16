"use client";

import { useState, type FormEvent } from "react";
import { dealership } from "@/config/dealership";
import type { LeadKind, VehicleIntent } from "@/lib/leads/types";
import { whatsappLink } from "@/lib/whatsapp";
import { readAttribution } from "./Attribution";
import { Arrow } from "./icons";

type Props = {
  kind: Exclude<LeadKind, "sell">;
  vehicle?: { stockId: string; title: string };
  defaultIntent?: VehicleIntent;
  /** Show date/time inputs (showroom visits). */
  withVisit?: boolean;
  submitLabel?: string;
  idPrefix?: string;
};

const intents: { v: VehicleIntent; label: string }[] = [
  { v: "call", label: "Call me back" },
  { v: "test-drive", label: "Test drive" },
  { v: "price", label: "Price & finance" },
  { v: "whatsapp", label: "WhatsApp me" },
];

export type SubmitState = { status: "idle" | "sending" | "done" | "error"; reference?: string; demo?: boolean; message?: string; fields?: Record<string, string> };

const newKey = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`);

/**
 * One key per form submission. Pressing Send again after a timeout reuses it, so the dealership receives one enquiry, not two.
 * It is renewed after a success, so a genuinely new enquiry from the same form is not mistaken for a repeat.
 */
export function useSubmissionKey(): [string, () => void] {
  const [key, setKey] = useState(newKey);
  return [key, () => setKey(newKey())];
}

export async function postEnquiry(body: Record<string, unknown>, idempotencyKey?: string): Promise<SubmitState> {
  try {
    const res = await fetch("/api/enquiry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, ...readAttribution(), page: location.pathname, idempotencyKey }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      window.dispatchEvent(new CustomEvent("vluce:enquiry", { detail: { kind: body.kind, intent: body.intent, stockId: body.stockId } }));
      return { status: "done", reference: data.reference, demo: data.demo };
    }
    return { status: "error", message: data.message ?? "Something went wrong. Please call or WhatsApp us.", fields: data.fields };
  } catch {
    return { status: "error", message: "You appear to be offline. Please call or WhatsApp us." };
  }
}

export function Received({ state, whatsappText }: { state: SubmitState; whatsappText: string }) {
  return (
    <div className="notice" role="status">
      <h3>Thank you — we have your enquiry.</h3>
      <p>A member of our team will be in touch shortly. Your reference is <span className="num">{state.reference}</span>.</p>
      <p>
        Prefer to talk now? <a className="link" style={{ letterSpacing: ".12em" }} href={whatsappLink(whatsappText)} target="_blank" rel="noopener">WhatsApp us</a>
      </p>
      {state.demo && <span className="notice__demo">Demo mode — this enquiry was not sent to a dealership</span>}
    </div>
  );
}

export function EnquiryForm({ kind, vehicle, defaultIntent = "call", withVisit, submitLabel = "Send enquiry", idPrefix = "enq" }: Props) {
  const [state, setState] = useState<SubmitState>({ status: "idle" });
  const [key, renewKey] = useSubmissionKey();
  const f = state.fields ?? {};
  const today = new Date().toISOString().slice(0, 10);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    setState({ status: "sending" });
    const result = await postEnquiry(
      {
        kind,
        name: d.get("name"),
        phone: d.get("phone"),
        email: d.get("email"),
        message: d.get("message"),
        intent: d.get("intent") ?? undefined,
        stockId: vehicle?.stockId,
        vehicleTitle: vehicle?.title,
        visit: withVisit ? { date: d.get("date"), time: d.get("time") } : undefined,
        consent: d.get("consent") === "on",
        marketing: d.get("marketing") === "on",
        website: d.get("website"),
      },
      key,
    );
    if (result.status === "done") renewKey();
    setState(result);
  }

  if (state.status === "done")
    return <Received state={state} whatsappText={vehicle ? `Hello, I just enquired about the ${vehicle.title} (${vehicle.stockId}).` : `Hello ${dealership.name}, I just sent an enquiry.`} />;

  const id = (k: string) => `${idPrefix}-${k}`;
  const err = (k: string) =>
    f[k] ? (
      <span className="field__error" id={id(`${k}-err`)}>
        {f[k]}
      </span>
    ) : null;
  const aria = (k: string) => (f[k] ? { "aria-invalid": true, "aria-describedby": id(`${k}-err`) } : {});

  return (
    <form className="form" onSubmit={onSubmit} noValidate>
      {kind === "vehicle" && (
        <fieldset className="segmented">
          <legend className="field" style={{ fontSize: 10, letterSpacing: ".24em", textTransform: "uppercase", color: "var(--text-2)", fontWeight: 600 }}>
            I would like
          </legend>
          {intents.map((i) => (
            <label key={i.v}>
              <input type="radio" name="intent" value={i.v} defaultChecked={i.v === defaultIntent} />
              <span>{i.label}</span>
            </label>
          ))}
        </fieldset>
      )}
      <div className={`field ${f.name ? "field--error" : ""}`}>
        <label htmlFor={id("name")}>Name</label>
        <input id={id("name")} name="name" autoComplete="name" required minLength={2} maxLength={80} {...aria("name")} />
        {err("name")}
      </div>
      <div className="form__row">
        <div className={`field ${f.phone ? "field--error" : ""}`}>
          <label htmlFor={id("phone")}>Mobile</label>
          <input id={id("phone")} name="phone" type="tel" inputMode="tel" autoComplete="tel" required placeholder="+91" {...aria("phone")} />
          {err("phone")}
        </div>
        <div className={`field ${f.email ? "field--error" : ""}`}>
          <label htmlFor={id("email")}>Email <span style={{ textTransform: "none", letterSpacing: 0 }}>(optional)</span></label>
          <input id={id("email")} name="email" type="email" autoComplete="email" {...aria("email")} />
          {err("email")}
        </div>
      </div>
      {withVisit && (
        <div className="form__row">
          <div className={`field ${f["visit.date"] ? "field--error" : ""}`}>
            <label htmlFor={id("date")}>Preferred date</label>
            <input id={id("date")} name="date" type="date" min={today} />
            {err("visit.date")}
          </div>
          <div className="field">
            <label htmlFor={id("time")}>Preferred time</label>
            <select id={id("time")} name="time" defaultValue="">
              <option value="">Any time</option>
              <option>Morning</option>
              <option>Afternoon</option>
              <option>Evening</option>
            </select>
          </div>
        </div>
      )}
      <div className="field">
        <label htmlFor={id("message")}>Message <span style={{ textTransform: "none", letterSpacing: 0 }}>(optional)</span></label>
        <textarea id={id("message")} name="message" maxLength={600} rows={3} />
      </div>
      <div className="hp" aria-hidden="true">
        <label>
          Website <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <label className="check">
        <input type="checkbox" name="consent" required {...aria("consent")} />
        <span>{dealership.consentText}</span>
      </label>
      {err("consent")}
      <label className="check">
        <input type="checkbox" name="marketing" />
        <span>Send me occasional news about new arrivals.</span>
      </label>
      {state.status === "error" && state.message && <p className="form-error" role="alert">{state.message}</p>}
      <button type="submit" className="btn btn--block" disabled={state.status === "sending"}>
        {state.status === "sending" ? "Sending…" : submitLabel} <Arrow />
      </button>
    </form>
  );
}
