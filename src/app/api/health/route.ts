import { NextResponse } from "next/server";
import { leadStore } from "@/lib/leads/db";
import { resolveDestination } from "@/lib/leads/destinations";

export const dynamic = "force-dynamic";

/** Deployment smoke check: is there somewhere real for enquiries to go? Reveals no secrets or addresses. */
export async function GET() {
  const resolved = await resolveDestination();
  const leads = resolved.kind === "destination" ? resolved.destination.id : resolved.kind;
  const ok = resolved.kind !== "none";
  return NextResponse.json({ ok, leads: { destination: leads, durable: !!leadStore() } }, { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
