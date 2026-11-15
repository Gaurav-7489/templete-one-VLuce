import { createHash, createHmac, timingSafeEqual } from "node:crypto";

/**
 * Verifies an inventory webhook from Intelligence. The signing secret is the hex SHA-256 of this site's website key, which both
 * sides can compute; nothing extra is configured. `X-VandLabs-Signature: v1=<hex HMAC-SHA256(secret, "<timestamp>.<body>")>`.
 * Requests more than five minutes old (or in the future) are refused, which limits replay; the event id is also checked once.
 */
export function webhookSecret(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export function verifyWebhook(key: string, timestamp: string, body: string, signature: string, nowSeconds = Math.floor(Date.now() / 1000)): boolean {
  const ts = Number(timestamp);
  if (!Number.isInteger(ts) || Math.abs(nowSeconds - ts) > 300) return false;
  const expected = Buffer.from(`v1=${createHmac("sha256", webhookSecret(key)).update(`${ts}.${body}`).digest("hex")}`);
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export type InventoryEvent = { id: string; type: "inventory.changed"; occurredAt: string; vehicles: { stockId: string; changes: string[] }[] };
