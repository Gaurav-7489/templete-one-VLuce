import { createHmac } from "node:crypto";

/**
 * The link between this website and a dealership's VandLabs Automotive Intelligence workspace.
 *
 * Two settings make a website connectable: VANDLABS_API_URL (the Intelligence address) and WEBSITE_SECRET (any long
 * random string, set once per deployment). The website derives its own read-only key from the secret, so nothing is
 * ever copied between the two products: the owner signs in on /connect with their Intelligence email and password,
 * Intelligence stores the key's hash against their workspace, and from then on this site reads that workspace's stock.
 *
 * A key made in Intelligence (Settings → API) and set as VANDLABS_API_KEY still works and takes precedence.
 * Everything here runs on the server only.
 */

export type Connection = { tenantId: string; dealership: string; site: string; expiresAt: string | null };

const b64 = (buf: Buffer) => buf.toString("base64url");

export const intelligenceUrl = () => (process.env.VANDLABS_API_URL ?? "").trim().replace(/\/$/, "");

/** The key this website presents to Intelligence. Same format Intelligence issues: vl_<12 chars>_<43 chars>. */
export function websiteKey(): string | null {
  const explicit = process.env.VANDLABS_API_KEY?.trim();
  if (explicit) return explicit;
  const secret = process.env.WEBSITE_SECRET?.trim();
  if (!secret || secret.length < 24) return null;
  const mac = (label: string) => createHmac("sha256", secret).update(`vandlabs-website:${label}`).digest();
  return `vl_${b64(mac("prefix")).slice(0, 12)}_${b64(mac("secret")).slice(0, 43)}`;
}

/** Whether this deployment can be connected from /connect (it has an Intelligence address and a secret). */
export const connectable = () => !!intelligenceUrl() && !!process.env.WEBSITE_SECRET && (process.env.WEBSITE_SECRET?.trim().length ?? 0) >= 24;

/**
 * The live connection, or null. Checked against Intelligence and cached for the inventory refresh window, so a
 * connection made or ended in either product takes effect within minutes (immediately after /connect, which
 * clears the cache).
 */
export async function getConnection(): Promise<Connection | null> {
  const base = intelligenceUrl();
  const key = websiteKey();
  if (!base || !key) return null;
  try {
    const res = await fetch(new URL("/api/v1/website", base), {
      headers: { Authorization: `Bearer ${key}`, Accept: "application/json" },
      next: { revalidate: Number(process.env.VANDLABS_REVALIDATE_SECONDS) || 300, tags: ["vandlabs-connection", "inventory"] },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { data?: Partial<Connection> };
    const d = body.data;
    return d?.tenantId ? { tenantId: d.tenantId, dealership: d.dealership ?? "", site: d.site ?? "", expiresAt: d.expiresAt ?? null } : null;
  } catch (error) {
    console.error(JSON.stringify({ event: "vandlabs_connection_unreachable", message: error instanceof Error ? error.message : "unknown" }));
    return null;
  }
}
