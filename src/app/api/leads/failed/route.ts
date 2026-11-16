import { NextResponse } from "next/server";
import { bearerMatches } from "@/lib/auth-token";
import { leadStore } from "@/lib/leads/db";
import { retryDue } from "@/lib/leads/service";

export const dynamic = "force-dynamic";

const deny = () => NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });

/**
 * Staff view of enquiries that have not reached their destination (Authorization: Bearer $LEADS_ADMIN_TOKEN).
 * Lists references, status, attempts and the last error, never the customer's details.
 */
export async function GET(request: Request) {
  if (!bearerMatches(request, process.env.LEADS_ADMIN_TOKEN)) return deny();
  const store = leadStore();
  if (!store) return NextResponse.json({ ok: true, durable: false, counts: {}, items: [] });
  return NextResponse.json({ ok: true, durable: true, counts: await store.counts(), items: await store.listFailed(100) }, { headers: { "Cache-Control": "no-store" } });
}

/** `{ "reference": "VL-…" }` puts a failed enquiry back in the queue and tries it straight away (after fixing the destination). */
export async function POST(request: Request) {
  if (!bearerMatches(request, process.env.LEADS_ADMIN_TOKEN)) return deny();
  const store = leadStore();
  if (!store) return NextResponse.json({ ok: false, message: "No DATABASE_URL: this site does not queue enquiries." }, { status: 409 });
  const body = (await request.json().catch(() => ({}))) as { reference?: unknown };
  const reference = typeof body.reference === "string" && /^VL-[0-9A-Z]{5}-[0-9A-Z]{5}$/.test(body.reference) ? body.reference : "";
  if (!reference || !(await store.requeue(reference))) return NextResponse.json({ ok: false, message: "No failed enquiry with that reference." }, { status: 404 });
  return NextResponse.json({ ok: true, requeued: reference, ...(await retryDue(store, 5)) });
}
