import { leadStore } from "./leads/db";

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export type Limit = { allowed: boolean; retryAfter: number; shared: boolean };

function local(key: string, limit: number, windowMs: number): Limit {
  const now = Date.now();
  if (buckets.size > 5000) for (const [k, v] of buckets) if (v.resetAt < now) buckets.delete(k);
  const b = buckets.get(key);
  if (!b || b.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: 0, shared: false };
  }
  b.count += 1;
  return { allowed: b.count <= limit, retryAfter: Math.ceil((b.resetAt - now) / 1000), shared: false };
}

/**
 * Rate limit shared across every serverless instance when the site has a database (DATABASE_URL), otherwise per instance.
 * A database outage falls back to the per-instance limit: it never removes the limit and never blocks a customer by itself.
 * Connected sites are also limited by Intelligence, which uses its own shared limiter, per visitor and per dealership.
 */
export async function rateLimit(key: string, limit: number, windowMs: number): Promise<Limit> {
  const store = leadStore();
  if (store) {
    try {
      return { ...(await store.hit(key, limit, windowMs)), shared: true };
    } catch (error) {
      console.error(JSON.stringify({ event: "rate_limit_store_unavailable", message: error instanceof Error ? error.message.slice(0, 120) : "unknown" }));
    }
  }
  return local(key, limit, windowMs);
}

/** The visitor's address as set by the hosting proxy (Vercel overwrites x-forwarded-for). */
export function clientIp(request: Request): string {
  return (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || request.headers.get("x-real-ip") || "local";
}

/** Browsers send Origin on cross-site POSTs; a request from another site is refused. */
export function sameOrigin(request: Request, requireOrigin = false): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!origin) return !requireOrigin && request.headers.get("sec-fetch-site") !== "cross-site";
  try {
    return !!host && new URL(origin).host === host;
  } catch {
    return false;
  }
}
