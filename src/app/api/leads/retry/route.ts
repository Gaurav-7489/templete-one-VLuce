import { NextResponse } from "next/server";
import { bearerMatches } from "@/lib/auth-token";
import { leadStore } from "@/lib/leads/db";
import { retryDue } from "@/lib/leads/service";

export const dynamic = "force-dynamic";

/**
 * Scheduled delivery of queued enquiries (Vercel Cron sends `Authorization: Bearer $CRON_SECRET`). Submissions also retry
 * opportunistically, so this is the safety net, not the only path. Also removes personal details of enquiries delivered over a week ago.
 */
export async function GET(request: Request) {
  if (!bearerMatches(request, process.env.CRON_SECRET)) return NextResponse.json({ ok: false }, { status: 401 });
  const store = leadStore();
  if (!store) return NextResponse.json({ ok: true, durable: false, attempted: 0 });
  const result = await retryDue(store, 50);
  const scrubbed = await store.scrubDelivered(7);
  return NextResponse.json({ ok: true, durable: true, ...result, scrubbed }, { headers: { "Cache-Control": "no-store" } });
}
