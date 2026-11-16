import { test } from "node:test";
import assert from "node:assert/strict";
import { env, json, lead, pgStore, stubFetch } from "./helpers";
import { submitLead, retryDue, referenceFor } from "../src/lib/leads/service";
import { resolveDestination } from "../src/lib/leads/destinations";
import { validateLead } from "../src/lib/leads/validate";
import { enquiryTypeOf } from "../src/lib/leads/types";
import { backoffSeconds, MAX_ATTEMPTS } from "../src/lib/leads/config";

const NONE = { LEAD_DESTINATION: undefined, LEAD_WEBHOOK_URL: undefined, VANDLABS_API_URL: undefined, WEBSITE_SECRET: undefined, VANDLABS_API_KEY: undefined, VANDLABS_TENANT_ID: undefined, LEAD_WEBHOOK_SECRET: undefined };

test("production with no destination is a configuration error, never a pretend success", async () => {
  const restore = env({ ...NONE, NODE_ENV: "production" });
  try {
    assert.equal((await resolveDestination()).kind, "none");
    const out = await submitLead(lead(), { store: null });
    assert.equal(out.ok, false);
    assert.equal((out as { code: string }).code, "not_configured");
    assert.equal((out as { status: number }).status, 503);
  } finally { restore(); }
});

test("demo mode only when asked for (or in local development), and it says so", async () => {
  let restore = env({ ...NONE, NODE_ENV: "production", LEAD_DESTINATION: "demo" });
  try {
    const out = await submitLead(lead(), { store: null });
    assert.ok(out.ok && out.demo && !out.delivered);
    assert.match(out.ok ? out.reference : "", /^DEMO-/);
  } finally { restore(); }
  restore = env({ ...NONE, NODE_ENV: "development" });
  try { assert.equal((await resolveDestination()).kind, "demo"); } finally { restore(); }
  // A webhook that is configured is never bypassed for demo.
  restore = env({ ...NONE, NODE_ENV: "development", LEAD_WEBHOOK_URL: "https://crm.example/hook" });
  try { const r = await resolveDestination(); assert.equal(r.kind === "destination" && r.destination.id, "webhook"); } finally { restore(); }
});

test("without a store: success only when delivered; a failure is reported and keeps the same reference on retry", async () => {
  const restore = env({ ...NONE, NODE_ENV: "production", LEAD_WEBHOOK_URL: "https://crm.example/hook", LEAD_WEBHOOK_SECRET: "s".repeat(32) });
  let up = false;
  const net = stubFetch(() => (up ? json(200, {}) : json(502, {})));
  try {
    const down = await submitLead(lead(), { store: null });
    assert.equal(down.ok, false);
    assert.equal((down as { code: string }).code, "delivery_failed");
    up = true;
    const ok = await submitLead(lead(), { store: null });
    assert.ok(ok.ok && ok.delivered);
    const [first, second] = net.calls;
    assert.equal(first.body.reference, second.body.reference, "a retried submission carries the same reference");
    const headers = second.init.headers as Record<string, string>;
    assert.equal(headers["Idempotency-Key"], "key-aaaaaaaaaaaaaaaaaaaa");
    assert.match(headers["X-VLuce-Signature"], /^sha256=[0-9a-f]{64}$/);
    assert.equal(second.body.type, "test_drive");
  } finally { net.restore(); restore(); }
});

test("with a store: accepted durably, retried with backoff, dead-lettered, requeued, delivered once", async () => {
  const restore = env({ ...NONE, NODE_ENV: "production", LEAD_WEBHOOK_URL: "https://crm.example/hook" });
  const { store, db } = await pgStore();
  let up = false;
  const net = stubFetch(() => (up ? json(200, {}) : new Response("down", { status: 503 })));
  try {
    const out = await submitLead(lead(), { store });
    assert.ok(out.ok, "the customer is told it was received: it is stored");
    assert.equal(out.ok && out.delivered, false);
    const reference = out.ok ? out.reference : "";
    assert.equal(reference, referenceFor("k:key-aaaaaaaaaaaaaaaaaaaa"));
    // A double click, or the same person from another tab within minutes: one enquiry.
    const again = await submitLead(lead(), { store });
    assert.ok(again.ok && again.duplicate && again.reference === reference);
    const otherTab = await submitLead(lead({ idempotencyKey: "key-bbbbbbbbbbbbbbbbbbbb" }), { store });
    assert.ok(otherTab.ok && otherTab.duplicate);
    assert.equal((await db.query("SELECT count(*)::int AS n FROM vluce_leads")).rows[0] && Number((await db.query<{ n: number }>("SELECT count(*)::int AS n FROM vluce_leads")).rows[0].n), 1);

    // Keep failing until the attempts run out: it becomes a failed delivery staff can see, with no personal details in the list.
    for (let i = 0; i < MAX_ATTEMPTS + 2; i++) { await db.query("UPDATE vluce_leads SET next_attempt_at = now() - interval '1 second'"); await retryDue(store); }
    const failed = await store.listFailed();
    assert.equal(failed.length, 1);
    assert.equal(failed[0].status, "failed");
    assert.equal(failed[0].attempts, MAX_ATTEMPTS);
    assert.ok(!JSON.stringify(failed).includes("98470"), "no phone number in the staff list");
    assert.equal(Number((await db.query<{ n: number }>("SELECT count(*)::int AS n FROM vluce_delivery_attempts")).rows[0].n), MAX_ATTEMPTS, "every attempt is recorded");

    up = true;
    assert.ok(await store.requeue(reference));
    assert.deepEqual(await retryDue(store), { attempted: 1, delivered: 1, failed: 0 });
    assert.deepEqual(await retryDue(store), { attempted: 0, delivered: 0, failed: 0 }, "a delivered enquiry is never sent again");
    assert.equal((await store.counts()).delivered, 1);
  } finally { net.restore(); restore(); await db.close(); }
});

test("a destination refusing for good (vehicle sold) is told to the customer, not retried", async () => {
  const restore = env({ ...NONE, NODE_ENV: "production", VANDLABS_API_URL: "https://intel.example", VANDLABS_API_KEY: `vl_${"a".repeat(12)}_${"b".repeat(43)}`, LEAD_DESTINATION: "vandlabs" });
  const { store, db } = await pgStore();
  const net = stubFetch(() => json(404, { detail: "This vehicle is no longer available." }));
  try {
    const out = await submitLead(lead(), { store });
    assert.equal(out.ok, false);
    assert.equal((out as { status: number }).status, 404);
    assert.equal(net.calls[0].url, "https://intel.example/api/v1/website/enquiries");
    assert.equal((await retryDue(store)).attempted, 0);
  } finally { net.restore(); restore(); await db.close(); }
});

test("a store outage is reported, never acknowledged", async () => {
  const restore = env({ ...NONE, NODE_ENV: "production", LEAD_WEBHOOK_URL: "https://crm.example/hook" });
  const broken = { create: async () => { throw new Error("connection refused"); } } as never;
  try {
    const out = await submitLead(lead(), { store: broken });
    assert.equal(out.ok, false);
    assert.equal((out as { code: string }).code, "unavailable");
  } finally { restore(); }
});

test("connected to Intelligence: every enquiry type goes there with the key, never the tenant from the browser", async () => {
  const key = `vl_${"a".repeat(12)}_${"b".repeat(43)}`;
  const restore = env({ ...NONE, NODE_ENV: "production", VANDLABS_API_URL: "https://intel.example", VANDLABS_API_KEY: key });
  const net = stubFetch((c) => (c.url.endsWith("/api/v1/website") ? json(200, { data: { tenantId: "11111111-1111-4111-8111-111111111111" } }) : json(201, { ok: true, reference: "L-1001" })));
  try {
    const kinds = [lead(), lead({ kind: "sell", stockId: undefined, intent: undefined, sell: { brand: "Honda", model: "City", year: 2019, km: 40000 } }), lead({ kind: "visit", stockId: undefined, intent: undefined, visit: { date: "2099-01-01", time: "Morning" } }), lead({ kind: "general", stockId: undefined, intent: undefined })];
    for (const [i, l] of kinds.entries()) assert.ok((await submitLead({ ...l, idempotencyKey: `key-${i}xxxxxxxxxxxxxxxxxx` }, { store: null })).ok);
    const posts = net.calls.filter((c) => c.url.endsWith("/enquiries"));
    assert.deepEqual(posts.map((p) => p.body.type), ["test_drive", "sell", "visit", "general"]);
    assert.ok(posts.every((p) => (p.init.headers as Record<string, string>).Authorization === `Bearer ${key}` && !("tenant" in p.body)));
  } finally { net.restore(); restore(); }
});

test("Intelligence down is not 'disconnected': enquiries are kept for Intelligence, not sent to demo", async () => {
  const restore = env({ ...NONE, NODE_ENV: "production", VANDLABS_API_URL: "https://intel.example", WEBSITE_SECRET: "x".repeat(32) });
  const net = stubFetch(() => { throw new Error("ECONNREFUSED"); });
  try {
    const r = await resolveDestination();
    assert.equal(r.kind === "destination" && r.destination.id, "vandlabs");
  } finally { net.restore(); restore(); }
  const restore2 = env({ ...NONE, NODE_ENV: "production", VANDLABS_API_URL: "https://intel.example", WEBSITE_SECRET: "x".repeat(32) });
  const net2 = stubFetch(() => json(401, {}));
  try { assert.equal((await resolveDestination()).kind, "none", "revoked and no webhook: an error, not demo"); } finally { net2.restore(); restore2(); }
});

test("validation and mapping", () => {
  assert.equal(validateLead({ kind: "visit", name: "Anu", phone: "9847012345", consent: true, visit: { date: "2000-01-01" } }).fields["visit.date"], "Please choose today or a later date.");
  const ok = validateLead({ kind: "vehicle", stockId: "V-1", name: "Anu", phone: "9847012345", consent: true, intent: "price", idempotencyKey: "short", referrer: "google.com" });
  assert.equal(ok.lead?.idempotencyKey, undefined, "a malformed key is ignored (the fingerprint still dedupes)");
  assert.equal(ok.lead?.referrer, "google.com");
  assert.equal(enquiryTypeOf({ kind: "vehicle", intent: "call" }), "callback");
  assert.equal(enquiryTypeOf({ kind: "vehicle" }), "vehicle");
  assert.ok(backoffSeconds(1, () => 0.5) === 30 && backoffSeconds(30, () => 0.5) === 6 * 3600);
});
