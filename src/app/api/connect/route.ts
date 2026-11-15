import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { siteUrl } from "@/lib/site";
import { connectable, intelligenceUrl, websiteKey } from "@/lib/vandlabs/connection";

export const dynamic = "force-dynamic";

const attempts = new Map<string, number[]>();
function limited(key: string, max = 8, windowMs = 10 * 60_000) {
  const now = Date.now();
  const recent = (attempts.get(key) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  attempts.set(key, recent);
  if (attempts.size > 2000) attempts.clear();
  return recent.length > max;
}
const problem = (status: number, message: string, code?: string) => NextResponse.json({ ok: false, message, code }, { status, headers: { "Cache-Control": "no-store" } });

/**
 * The dealership owner connects (or disconnects) this website from /connect. The email and password go from this
 * site's server straight to Intelligence and are never stored or logged here.
 */
export async function POST(request: Request) {
  // Websites are now linked by VandLabs with a server-to-server key (VANDLABS_API_KEY). Owners never type a password into a website.
  if (process.env.LEGACY_PASSWORD_CONNECT?.trim().toLowerCase() !== "enabled") return problem(410, "This website is linked by VandLabs. Ask VandLabs support.", "gone");
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!origin || !host || new URL(origin).host !== host) return problem(403, "Request origin is not allowed.");
  if (!connectable()) return problem(503, "This website is not set up for a connection yet. Set VANDLABS_API_URL and WEBSITE_SECRET, then redeploy.");
  const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "local";
  if (limited(ip)) return problem(429, "Too many attempts. Wait ten minutes and try again.");
  const text = await request.text();
  if (text.length > 2000) return problem(413, "Request is too large.");
  let body: Record<string, unknown>;
  try { body = JSON.parse(text); } catch { return problem(422, "Please try again."); }
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  const email = str(body.email).trim();
  const password = str(body.password);
  if (!email || !password) return problem(422, "Enter your Intelligence email and password.");
  const action = body.action === "disconnect" ? "disconnect" : "connect";

  let res: Response;
  try {
    res = await fetch(new URL("/api/public/website/connect", intelligenceUrl()), {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Forwarded-For": ip },
      body: JSON.stringify({ action, email, password, code: str(body.code) || undefined, key: websiteKey(), siteUrl }),
      signal: AbortSignal.timeout(12_000),
      cache: "no-store",
    });
  } catch {
    return problem(503, "Intelligence could not be reached. Check VANDLABS_API_URL and try again.");
  }
  const out = (await res.json().catch(() => ({}))) as { error?: { code?: string; message?: string }; dealership?: string; site?: string; disconnected?: boolean };
  if (!res.ok) return problem(res.status, out.error?.message ?? "The connection could not be completed.", out.error?.code);
  // Every page switches between demo and connected stock on its next visit, not after the cache window.
  revalidateTag("vandlabs-connection");
  revalidateTag("inventory");
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true, action, dealership: out.dealership ?? "", site: out.site ?? "" }, { headers: { "Cache-Control": "no-store" } });
}
