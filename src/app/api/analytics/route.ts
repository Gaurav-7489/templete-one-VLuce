import { NextResponse } from "next/server";
import { clientIp, rateLimit, sameOrigin } from "@/lib/ratelimit";
import { connectionState, intelligenceUrl, websiteKey } from "@/lib/vandlabs/connection";

export const dynamic = "force-dynamic";

const TYPES = new Set(["visit", "vehicle_view", "whatsapp_click", "call_click"]);
const SID = /^[A-Za-z0-9_-]{16,64}$/;

/**
 * First-party, cookieless website analytics. Forwarded server-side to the dealership's Intelligence workspace only when this site
 * is connected (the key never reaches the browser); otherwise accepted and dropped. Nothing personal is collected: a random id
 * that lives only for the browser tab (to count a visit once), the page type, the campaign tags and a device category.
 */
export async function POST(request: Request) {
  if (!sameOrigin(request, true)) return new NextResponse(null, { status: 403 });
  const limit = await rateLimit(`analytics:${clientIp(request)}`, 60, 60_000);
  if (!limit.allowed) return new NextResponse(null, { status: 429 });
  const text = await request.text();
  if (text.length > 4000) return new NextResponse(null, { status: 413 });
  let raw: { events?: unknown };
  try { raw = JSON.parse(text); } catch { return new NextResponse(null, { status: 400 }); }
  const events = (Array.isArray(raw.events) ? raw.events : []).slice(0, 10).filter((e): e is Record<string, unknown> => !!e && typeof e === "object" && TYPES.has(String((e as Record<string, unknown>).type)) && SID.test(String((e as Record<string, unknown>).sid ?? "")));
  const base = intelligenceUrl();
  const key = websiteKey();
  if (!events.length || !base || !key || (await connectionState()).state !== "connected") return new NextResponse(null, { status: 204 });
  try {
    await fetch(new URL("/api/v1/website/events", base), {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ events: events.map((e) => ({ type: e.type, sid: e.sid, stockId: e.stockId, source: e.source, medium: e.medium, campaign: e.campaign, device: e.device })) }),
      signal: AbortSignal.timeout(4000),
      cache: "no-store",
    });
  } catch {
    /* analytics never affect the visitor */
  }
  return new NextResponse(null, { status: 204 });
}
