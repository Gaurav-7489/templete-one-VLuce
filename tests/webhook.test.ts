import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash, createHmac, randomUUID } from "node:crypto";
import { env } from "./helpers";
import { verifyWebhook } from "../src/lib/vandlabs/webhook";
import { websiteKey } from "../src/lib/vandlabs/connection";

/** Exactly how Intelligence signs (apps/intelligence/lib/server/website-webhooks.ts). */
const signLikeIntelligence = (key: string, ts: number, body: string) => `v1=${createHmac("sha256", createHash("sha256").update(key).digest("hex")).update(`${ts}.${body}`).digest("hex")}`;

test("signature: accepts Intelligence's signature; refuses tampering, stale or future timestamps, other keys", () => {
  const key = `vl_${"a".repeat(12)}_${"b".repeat(43)}`;
  const body = JSON.stringify({ id: randomUUID(), type: "inventory.changed", vehicles: [{ stockId: "V-1", changes: ["sold"] }] });
  const ts = Math.floor(Date.now() / 1000);
  const sig = signLikeIntelligence(key, ts, body);
  assert.ok(verifyWebhook(key, String(ts), body, sig));
  assert.ok(!verifyWebhook(key, String(ts), body.replace("sold", "available"), sig), "tampered body");
  assert.ok(!verifyWebhook(key, String(ts - 301), body, signLikeIntelligence(key, ts - 301, body)), "replayed after five minutes");
  assert.ok(!verifyWebhook(key, String(ts + 301), body, signLikeIntelligence(key, ts + 301, body)), "future timestamp");
  assert.ok(!verifyWebhook(`vl_${"c".repeat(12)}_${"b".repeat(43)}`, String(ts), body, sig), "another website's key");
  assert.ok(!verifyWebhook(key, "abc", body, sig));
});

test("receiver: unsigned, wrong-signature and malformed requests are refused before anything is refreshed", async () => {
  const restore = env({ WEBSITE_SECRET: "s".repeat(32), VANDLABS_API_KEY: undefined, DATABASE_URL: undefined });
  try {
    const { POST } = await import("../src/app/api/webhooks/inventory/route");
    const key = websiteKey()!;
    const id = randomUUID();
    const body = JSON.stringify({ id, type: "inventory.changed", occurredAt: new Date().toISOString(), vehicles: [] });
    const ts = Math.floor(Date.now() / 1000);
    const send = (headers: Record<string, string>, b = body) => POST(new Request("https://site.example/api/webhooks/inventory", { method: "POST", headers: { "x-forwarded-for": "1.1.1.1", ...headers }, body: b }));
    assert.equal((await send({})).status, 401);
    assert.equal((await send({ "x-vandlabs-timestamp": String(ts), "x-vandlabs-signature": "v1=00" })).status, 401);
    const bad = "{not json";
    assert.equal((await send({ "x-vandlabs-timestamp": String(ts), "x-vandlabs-signature": signLikeIntelligence(key, ts, bad), "x-vandlabs-event-id": id }, bad)).status, 422);
    const mismatched = await send({ "x-vandlabs-timestamp": String(ts), "x-vandlabs-signature": signLikeIntelligence(key, ts, body), "x-vandlabs-event-id": randomUUID() });
    assert.equal(mismatched.status, 422, "the signed event id must match the header");
  } finally { restore(); }
});
