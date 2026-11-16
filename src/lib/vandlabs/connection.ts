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

/** What the website knows about its link: connected, not connected (Intelligence said no), or unknown (Intelligence did not answer). */
export type ConnectionState = { state: "connected"; connection: Connection } | { state: "disconnected" } | { state: "unreachable" };

/**
 * Checks the link against Intelligence, cached for the inventory refresh window (and cleared on /connect and by an inventory event).
 * "disconnected" means Intelligence answered and refused the key. "unreachable" means it did not answer, which must never be read as
 * "not connected": a connected dealership would otherwise silently get demo stock and demo enquiries during an outage.
 */
export async function connectionState(): Promise<ConnectionState> {
  const base = intelligenceUrl();
  const key = websiteKey();
  if (!base || !key) return { state: "disconnected" };
  try {
    const res = await fetch(new URL("/api/v1/website", base), {
      headers: { Authorization: `Bearer ${key}`, Accept: "application/json" },
      next: { revalidate: Number(process.env.VANDLABS_REVALIDATE_SECONDS) || 300, tags: ["vandlabs-connection", "inventory"] },
      signal: AbortSignal.timeout(8000),
    });
    if (res.status === 401 || res.status === 403 || res.status === 404) return { state: "disconnected" };
    if (!res.ok) return { state: "unreachable" };
    const body = (await res.json()) as { data?: Partial<Connection> };
    const d = body.data;
    return d?.tenantId
      ? { state: "connected", connection: { tenantId: d.tenantId, dealership: d.dealership ?? "", site: d.site ?? "", expiresAt: d.expiresAt ?? null } }
      : { state: "disconnected" };
  } catch (error) {
    console.error(JSON.stringify({ event: "vandlabs_connection_unreachable", message: error instanceof Error ? error.message : "unknown" }));
    return { state: "unreachable" };
  }
}

/** The live connection, or null when the website is not connected (or Intelligence cannot be reached right now). */
export async function getConnection(): Promise<Connection | null> {
  const result = await connectionState();
  return result.state === "connected" ? result.connection : null;
}
