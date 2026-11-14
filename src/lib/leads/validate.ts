import type { Lead, LeadKind, VehicleIntent } from "./types";

const clean = (s: unknown, max: number) =>
  typeof s === "string" ? s.replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max) : "";
const KINDS: LeadKind[] = ["vehicle", "sell", "visit", "general"];
const INTENTS: VehicleIntent[] = ["call", "whatsapp", "test-drive", "price"];
const num = (v: unknown) => {
  const n = typeof v === "number" ? v : Number(String(v ?? "").replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : NaN;
};

/** Validates an enquiry body. Field messages are written for customers. */
export function validateLead(raw: Record<string, unknown>): { lead: Lead | null; fields: Record<string, string> } {
  const fields: Record<string, string> = {};
  const kind = KINDS.find((k) => k === raw.kind) ?? "general";
  const name = clean(raw.name, 80);
  const phone = clean(raw.phone, 20);
  const digits = phone.replace(/\D/g, "");
  const email = clean(raw.email, 120);
  if (name.length < 2) fields.name = "Please enter your name.";
  if (digits.length < 10 || digits.length > 13 || !/^\+?[\d\s-]+$/.test(phone)) fields.phone = "Please enter a valid 10-digit mobile number.";
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) fields.email = "Please check your email address.";
  if (raw.consent !== true) fields.consent = "Please allow us to contact you about this enquiry.";

  const lead: Partial<Lead> = {
    kind,
    name,
    phone: digits.length === 10 ? `+91 ${digits.slice(0, 5)} ${digits.slice(5)}` : `+${digits}`,
    email: email || undefined,
    message: clean(raw.message, 600) || undefined,
    consent: true,
    marketing: raw.marketing === true,
    page: clean(raw.page, 200) || undefined,
    utm: {
      source: clean(raw.utmSource, 40).toLowerCase() || undefined,
      medium: clean(raw.utmMedium, 40).toLowerCase() || undefined,
      campaign: clean(raw.utmCampaign, 80) || undefined,
    },
  };

  if (kind === "vehicle") {
    const stockId = clean(raw.stockId, 40);
    if (!/^[A-Za-z0-9-]{1,40}$/.test(stockId)) fields.stockId = "This vehicle could not be identified.";
    lead.stockId = stockId;
    lead.vehicleTitle = clean(raw.vehicleTitle, 160) || undefined;
    lead.intent = INTENTS.find((i) => i === raw.intent) ?? "call";
  }
  if (kind === "sell") {
    const s = (raw.sell ?? {}) as Record<string, unknown>;
    const year = num(s.year);
    const km = num(s.km);
    const brand = clean(s.brand, 40);
    const model = clean(s.model, 60);
    if (!brand) fields["sell.brand"] = "Please tell us the make.";
    if (!model) fields["sell.model"] = "Please tell us the model.";
    if (!(year >= 1950 && year <= new Date().getFullYear() + 1)) fields["sell.year"] = "Please choose the model year.";
    if (!(km >= 0 && km < 2_000_000)) fields["sell.km"] = "Please enter the kilometres driven.";
    const expected = num(s.expectedPrice);
    lead.sell = {
      brand,
      model,
      variant: clean(s.variant, 60) || undefined,
      year,
      km,
      owners: num(s.owners) > 0 ? num(s.owners) : undefined,
      city: clean(s.city, 60) || undefined,
      expectedPrice: expected > 0 ? expected : undefined,
    };
  }
  if (kind === "visit") {
    const v = (raw.visit ?? {}) as Record<string, unknown>;
    const date = clean(v.date, 10);
    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) fields["visit.date"] = "Please choose a date.";
    lead.visit = { date: date || undefined, time: clean(v.time, 20) || undefined };
  }
  if (Object.keys(fields).length) return { lead: null, fields };
  return { lead: lead as Lead, fields };
}
