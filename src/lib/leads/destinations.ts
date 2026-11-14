import type { Lead, LeadDestination, LeadResult } from "./types";

const ref = (prefix: string) => `${prefix}-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

/**
 * Demo destination: accepts every enquiry, sends nothing anywhere, and says so.
 * Contact details are not logged.
 */
export const demoDestination: LeadDestination = {
  id: "demo",
  accepts: () => true,
  async send(lead) {
    console.info(JSON.stringify({ event: "demo_enquiry", kind: lead.kind, stockId: lead.stockId, utm: lead.utm }));
    return { ok: true, reference: ref("DEMO"), destination: "demo", demo: true };
  },
};

/** Generic webhook (a CRM, Zapier, Make, n8n, the dealer's own endpoint). POSTs the lead as JSON. */
export function webhookDestination(url: string): LeadDestination {
  return {
    id: "webhook",
    accepts: () => true,
    async send(lead): Promise<LeadResult> {
      const reference = ref("VL");
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference, receivedAt: new Date().toISOString(), source: "website", ...lead }),
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) return { ok: false, status: 503, message: "We could not send your enquiry just now. Please call or WhatsApp us." };
      return { ok: true, reference, destination: "webhook" };
    },
  };
}

/**
 * VandLabs Automotive Intelligence — website enquiry adapter.
 *
 * Verified against apps/intelligence/app/api/public/enquiry/route.ts and lib/server/website-enquiry.ts:
 *   POST {VANDLABS_API_URL}/api/public/enquiry
 *   { tenant, stock, name, phone, message, intent: call|whatsapp|test-drive|price, consent, marketing, utmSource, utmCampaign }
 *   → 201 { ok, reference, duplicate }  · 404 vehicle not published · 422 field errors · 429 rate limited · 503 unavailable
 *
 * The enquiry becomes a lead on that vehicle with source "Website", in the vehicle's branch,
 * attributed to the campaign whose UTM tag the visitor arrived with. The endpoint is same-origin
 * protected; a server-to-server request carrying a Bearer header and no cookie passes that check,
 * so the call is made from this site's server with the Business API key.
 *
 * Intelligence only accepts enquiries about a specific published vehicle. Sell-your-car, visit
 * and general enquiries are therefore not sent here (accepts() returns false) and fall through to
 * the next destination. A future Intelligence endpoint for those can be added in this file.
 */
export function vandlabsDestination(opts: { baseUrl: string; apiKey: string; tenantId: string }): LeadDestination {
  return {
    id: "vandlabs",
    accepts: (lead) => lead.kind === "vehicle" && !!lead.stockId,
    async send(lead): Promise<LeadResult> {
      const res = await fetch(new URL("/api/public/enquiry", opts.baseUrl), {
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
      const body = (await res.json().catch(() => ({}))) as { reference?: string; detail?: string; title?: string; fields?: Record<string, string> };
      if (res.ok) return { ok: true, reference: body.reference ?? "received", destination: "vandlabs" };
      return { ok: false, status: res.status, message: body.detail ?? "We could not send your enquiry just now. Please call or WhatsApp us.", fields: body.fields };
    },
  };
}

/** Destinations in priority order. The first that accepts a lead receives it. */
export function leadDestinations(): LeadDestination[] {
  const mode = process.env.LEAD_DESTINATION ?? "demo";
  const list: LeadDestination[] = [];
  const { VANDLABS_API_URL: url, VANDLABS_API_KEY: key, VANDLABS_TENANT_ID: tenant, LEAD_WEBHOOK_URL: hook } = process.env;
  if (mode === "vandlabs" && url && key && tenant) list.push(vandlabsDestination({ baseUrl: url, apiKey: key, tenantId: tenant }));
  if ((mode === "webhook" || mode === "vandlabs") && hook) list.push(webhookDestination(hook));
  list.push(demoDestination);
  return list;
}

export async function routeLead(lead: Lead): Promise<LeadResult> {
  const target = leadDestinations().find((d) => d.accepts(lead))!;
  return target.send(lead);
}
