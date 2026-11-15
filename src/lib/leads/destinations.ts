import { createHmac } from "node:crypto";
import { connectionState, intelligenceUrl, websiteKey } from "../vandlabs/connection";
import { demoAllowed, leadMode, webhookUrl } from "./config";
import { enquiryTypeOf, type DeliveryResult, type Lead, type LeadDestination } from "./types";

const GENERIC = "We could not send your enquiry just now. Please call or WhatsApp us.";
const retryableStatus = (status: number) => status === 408 || status === 425 || status === 429 || status >= 500;

/** What a destination logs: never a name, number, e-mail or message. */
const note = (s: string) => s.replace(/\+?\d[\d\s-]{7,}/g, "[number]").slice(0, 160);

/**
 * Demo destination: accepts the enquiry, sends it nowhere, and the visitor is told so. It is only ever chosen
 * explicitly (LEAD_DESTINATION=demo) or in local development; see config.ts.
 */
export const demoDestination: LeadDestination = {
  id: "demo",
  accepts: () => true,
  async send(lead, ctx): Promise<DeliveryResult> {
    console.info(JSON.stringify({ event: "demo_enquiry", type: enquiryTypeOf(lead), reference: ctx.reference }));
    return { ok: true, reference: ctx.reference };
  },
};

/** Generic webhook (a CRM, Zapier, Make, n8n, the dealer's own endpoint). POSTs the enquiry as JSON, signed when LEAD_WEBHOOK_SECRET is set. */
export function webhookDestination(url: string, secret = process.env.LEAD_WEBHOOK_SECRET?.trim()): LeadDestination {
  return {
    id: "webhook",
    accepts: () => true,
    async send(lead, ctx): Promise<DeliveryResult> {
      const body = JSON.stringify({ reference: ctx.reference, type: enquiryTypeOf(lead), receivedAt: lead.submittedAt ?? new Date().toISOString(), source: "website", ...lead });
      const headers: Record<string, string> = { "Content-Type": "application/json", "Idempotency-Key": ctx.idempotencyKey, "X-VLuce-Reference": ctx.reference };
      if (secret) headers["X-VLuce-Signature"] = `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
      try {
        const res = await fetch(url, { method: "POST", headers, body, signal: AbortSignal.timeout(8000), redirect: "error" });
        if (res.ok) return { ok: true, reference: ctx.reference };
        // A CRM that errors may have a fault we can wait out; the enquiry is kept either way.
        return { ok: false, retryable: true, status: res.status, message: GENERIC };
      } catch (error) {
        return { ok: false, retryable: true, status: 503, message: note(error instanceof Error ? error.message : "unreachable") };
      }
    },
  };
}

/**
 * VandLabs Automotive Intelligence adapter (only for dealerships that subscribe and connect).
 *
 *   POST {VANDLABS_API_URL}/api/v1/website/enquiries   Authorization: Bearer <website key>   Idempotency-Key: <key>
 *   { type, reference, submittedAt, name, phone, email?, message?, stockId?, appointment?, sell?, consent, consentAt, marketing,
 *     utmSource?, utmMedium?, utmCampaign?, referrer?, page? }
 *   → 201 { ok, reference, duplicate } · 404 vehicle not available · 422 field errors · 401/403 key problem · 429/5xx try later
 *
 * The workspace comes from the key, never from this request. An Intelligence deployment that predates this endpoint answers 404 or
 * 405 and vehicle enquiries then use the older /api/public/enquiry route; other enquiry types wait (they are kept, not dropped).
 */
export function vandlabsDestination(opts: { baseUrl: string; apiKey: string; tenantId?: string }): LeadDestination {
  return {
    id: "vandlabs",
    accepts: () => true,
    async send(lead, ctx): Promise<DeliveryResult> {
      const headers = { "Content-Type": "application/json", Authorization: `Bearer ${opts.apiKey}`, "Idempotency-Key": ctx.idempotencyKey };
      const body = {
        type: enquiryTypeOf(lead),
        reference: ctx.reference,
        submittedAt: lead.submittedAt,
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        message: lead.message,
        stockId: lead.stockId,
        vehicleTitle: lead.vehicleTitle,
        appointment: lead.visit ? { date: lead.visit.date, time: lead.visit.time } : undefined,
        sell: lead.sell,
        consent: true,
        consentAt: lead.submittedAt,
        marketing: lead.marketing,
        utmSource: lead.utm.source,
        utmMedium: lead.utm.medium,
        utmCampaign: lead.utm.campaign,
        referrer: lead.referrer,
        page: lead.page,
      };
      try {
        let res = await fetch(new URL("/api/v1/website/enquiries", opts.baseUrl), { method: "POST", headers, body: JSON.stringify(body), signal: AbortSignal.timeout(8000), cache: "no-store" });
        if ((res.status === 404 || res.status === 405) && lead.kind === "vehicle" && lead.stockId && opts.tenantId) res = await legacyVehicleEnquiry(opts as Required<typeof opts>, lead);
        const out = (await res.json().catch(() => ({}))) as { reference?: string; detail?: string; fields?: Record<string, string> };
        if (res.ok) return { ok: true, reference: out.reference };
        // 401/403: the key was revoked or expired. That is fixed by reconnecting, so the enquiry is kept rather than refused.
        if (res.status === 401 || res.status === 403) return { ok: false, retryable: true, status: 503, message: GENERIC };
        return { ok: false, retryable: retryableStatus(res.status), status: res.status, message: out.detail ?? GENERIC, fields: out.fields };
      } catch (error) {
        return { ok: false, retryable: true, status: 503, message: note(error instanceof Error ? error.message : "unreachable") };
      }
    },
  };
}

function legacyVehicleEnquiry(opts: { baseUrl: string; apiKey: string; tenantId: string }, lead: Lead): Promise<Response> {
  return fetch(new URL("/api/public/enquiry", opts.baseUrl), {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${opts.apiKey}` },
    body: JSON.stringify({
      tenant: opts.tenantId,
      stock: lead.stockId,
      name: lead.name,
      phone: lead.phone,
      message: [lead.message, lead.email ? `Email: ${lead.email}` : ""].filter(Boolean).join(" — "),
      intent: lead.intent ?? "call",
      consent: true,
      marketing: lead.marketing,
      utmSource: lead.utm.source,
      utmCampaign: lead.utm.campaign,
    }),
    signal: AbortSignal.timeout(8000),
  });
}

export type Resolution =
  | { kind: "destination"; destination: LeadDestination }
  | { kind: "demo" }
  /** Nothing is configured to receive enquiries. In production this is an error shown to the visitor, never a pretend success. */
  | { kind: "none"; reason: string };

/**
 * Chooses where an enquiry goes. In order: Intelligence (when this site is connected to a workspace), then LEAD_WEBHOOK_URL.
 * Demo is never a fallback: it is chosen only when explicitly configured, or in local development with nothing configured.
 */
export async function resolveDestination(): Promise<Resolution> {
  const mode = leadMode();
  if (mode === "demo") return { kind: "demo" };
  const url = intelligenceUrl();
  const key = websiteKey();
  if (url && key && (mode === "vandlabs" || mode === "auto")) {
    // "unreachable" still routes to Intelligence: the enquiry is retried there rather than sent somewhere unintended.
    const link = mode === "vandlabs" ? ({ state: "connected" } as const) : await connectionState();
    if (link.state !== "disconnected") return { kind: "destination", destination: vandlabsDestination({ baseUrl: url, apiKey: key, tenantId: process.env.VANDLABS_TENANT_ID || (link.state === "connected" && "connection" in link ? link.connection.tenantId : undefined) }) };
    if (mode === "vandlabs") return { kind: "none", reason: "LEAD_DESTINATION=vandlabs but this website is not connected to Intelligence." };
  } else if (mode === "vandlabs") {
    return { kind: "none", reason: "LEAD_DESTINATION=vandlabs needs VANDLABS_API_URL and a website key." };
  }
  const hook = webhookUrl();
  if (hook) return { kind: "destination", destination: webhookDestination(hook) };
  if (mode === "webhook") return { kind: "none", reason: "LEAD_DESTINATION=webhook needs LEAD_WEBHOOK_URL." };
  if (demoAllowed()) return { kind: "demo" };
  return { kind: "none", reason: "No enquiry destination is configured. Set LEAD_WEBHOOK_URL, connect Intelligence, or set LEAD_DESTINATION=demo for a demonstration." };
}
