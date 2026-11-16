import { after, NextResponse } from "next/server";
import { getInventory, inventorySource } from "@/lib/inventory";
import { leadStore } from "@/lib/leads/db";
import { retryDue, submitLead } from "@/lib/leads/service";
import { validateLead } from "@/lib/leads/validate";
import { clientIp, rateLimit, sameOrigin } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

const problem = (status: number, message: string, extra: Record<string, unknown> = {}, headers: Record<string, string> = {}) =>
  NextResponse.json({ ok: false, message, ...extra }, { status, headers: { "Cache-Control": "no-store", ...headers } });

/** Every enquiry form on the site posts here. The server decides where the lead goes (see lib/leads). */
export async function POST(request: Request) {
  if (!sameOrigin(request)) return problem(403, "Request origin is not allowed.");
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > 6000) return problem(413, "That message is too long.");
  const text = await request.text();
  if (text.length > 6000) return problem(413, "That message is too long.");
  let raw: Record<string, unknown>;
  try {
    raw = JSON.parse(text);
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("not an object");
  } catch {
    return problem(422, "Please try again.");
  }
  // Honeypot: real visitors never see or fill this field.
  if (typeof raw.website === "string" && raw.website.trim()) return NextResponse.json({ ok: true, reference: "received" }, { status: 201 });

  const { lead, fields } = validateLead(raw);
  if (!lead) return problem(422, "Please check the highlighted details.", { fields });
  // Only complete submissions count towards the limit, so correcting a typo never locks a customer out.
  const ip = clientIp(request);
  const limit = await rateLimit(`enquiry:${ip}`, 6, 10 * 60_000);
  if (!limit.allowed) return problem(429, "Too many enquiries from this device. Please call or WhatsApp us.", {}, { "Retry-After": String(limit.retryAfter) });

  // A sold or unlisted car never takes an enquiry as if it were available. Intelligence checks this itself on connected sites.
  if (lead.kind === "vehicle" && (await inventorySource()).id !== "vandlabs") {
    const car = (await getInventory()).find((v) => v.stockId.toLowerCase() === lead.stockId?.toLowerCase());
    if (!car || car.availability === "sold") return problem(404, "This vehicle is no longer available. Please ask us about similar cars.", { code: "unavailable" });
  }

  const result = await submitLead(lead);
  // Anything queued earlier (a CRM that was down) gets another chance once the customer has their answer.
  const store = leadStore();
  if (store) after(() => retryDue(store, 10).then(() => undefined, () => undefined));
  if (!result.ok) return problem(result.status, result.message, { code: result.code, fields: result.fields });
  return NextResponse.json({ ok: true, reference: result.reference, delivered: result.delivered, duplicate: result.duplicate, demo: result.demo ?? false }, { status: result.duplicate ? 200 : 201, headers: { "Cache-Control": "no-store" } });
}
