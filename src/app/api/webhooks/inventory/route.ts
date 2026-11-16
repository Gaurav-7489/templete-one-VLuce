import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { websiteKey } from "@/lib/vandlabs/connection";
import { verifyWebhook, type InventoryEvent } from "@/lib/vandlabs/webhook";

export const dynamic = "force-dynamic";

const reply = (status: number, body: Record<string, unknown>) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

/**
 * Intelligence tells this site its published stock changed. A valid, fresh, first-seen event refreshes every page that shows
 * stock. The event carries no stock data: pages re-read it through the authenticated inventory API, so a forged event could at
 * most cause a refresh, and an unsigned one is refused. The periodic refresh stays as the fallback for a missed event.
 */
export async function POST(request: Request) {
  const ip = await rateLimit(`webhook-ip:${clientIp(request)}`, 120, 60_000);
  if (!ip.allowed) return reply(429, { ok: false });
  const key = websiteKey();
  if (!key) return reply(404, { ok: false });
  const body = await request.text();
  if (body.length > 64_000) return reply(413, { ok: false });
  const ok = verifyWebhook(key, request.headers.get("x-vandlabs-timestamp") ?? "", body, request.headers.get("x-vandlabs-signature") ?? "");
  if (!ok) return reply(401, { ok: false });
  let event: InventoryEvent;
  try {
    event = JSON.parse(body) as InventoryEvent;
  } catch {
    return reply(422, { ok: false });
  }
  const id = request.headers.get("x-vandlabs-event-id") ?? event.id ?? "";
  if (!/^[0-9a-f-]{36}$/i.test(id) || event.id !== id) return reply(422, { ok: false });
  // Each event id is acted on once (shared across instances when the site has a database).
  const first = await rateLimit(`webhook-event:${id}`, 1, 10 * 60_000);
  if (!first.allowed) return reply(200, { ok: true, duplicate: true });
  revalidateTag("inventory");
  revalidatePath("/", "layout");
  console.info(JSON.stringify({ event: "inventory_webhook", id, vehicles: Array.isArray(event.vehicles) ? event.vehicles.length : 0 }));
  return reply(200, { ok: true });
}
