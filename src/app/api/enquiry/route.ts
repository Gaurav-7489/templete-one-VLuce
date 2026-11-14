import { NextResponse } from "next/server";
import { routeLead } from "@/lib/leads/destinations";
import { validateLead } from "@/lib/leads/validate";

export const dynamic = "force-dynamic";

/** Simple per-instance limiter. A production deployment can swap this for a shared store. */
const hits = new Map<string, number[]>();
function limited(key: string, max = 6, windowMs = 10 * 60_000) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > max;
}

const problem = (status: number, message: string, fields?: Record<string, string>) => NextResponse.json({ ok: false, message, fields }, { status });

/** Every enquiry form on the site posts here. The server decides where the lead goes (see lib/leads). */
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (origin && host && new URL(origin).host !== host) return problem(403, "Request origin is not allowed.");

  const text = await request.text();
  if (text.length > 6000) return problem(413, "That message is too long.");
  let raw: Record<string, unknown>;
  try {
    raw = JSON.parse(text);
  } catch {
    return problem(422, "Please try again.");
  }
  // Honeypot: real visitors never see or fill this field.
  if (typeof raw.website === "string" && raw.website.trim()) return NextResponse.json({ ok: true, reference: "received" }, { status: 201 });

  const { lead, fields } = validateLead(raw);
  if (!lead) return problem(422, "Please check the highlighted details.", fields);
  // Only complete submissions count towards the limit, so correcting a typo never locks a customer out.
  const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "local";
  if (limited(ip)) return problem(429, "Too many enquiries from this device. Please call or WhatsApp us.");
  try {
    const result = await routeLead(lead);
    if (!result.ok) return problem(result.status, result.message, result.fields);
    return NextResponse.json({ ok: true, reference: result.reference, demo: result.demo ?? false }, { status: 201 });
  } catch (error) {
    console.error(JSON.stringify({ event: "enquiry_failure", message: error instanceof Error ? error.message : "unknown" }));
    return problem(503, "We could not send your enquiry just now. Please call or WhatsApp us.");
  }
}
