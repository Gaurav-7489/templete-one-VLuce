import { createHash, randomUUID } from "node:crypto";
import { MAX_ATTEMPTS } from "./config";
import { leadStore } from "./db";
import { demoDestination, resolveDestination } from "./destinations";
import { fingerprintOf, type LeadRecord, type LeadStore } from "./store";
import { enquiryTypeOf, type DeliveryResult, type Lead, type SubmitOutcome } from "./types";

const CONTACT = "Please call or WhatsApp us so we can help right away.";
const KEY = /^[A-Za-z0-9_-]{16,64}$/;
const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

/** A short reference the customer can quote. Derived from the dedupe key, so a retry of the same submission gets the same one. */
export function referenceFor(dedupeKey: string): string {
  const bytes = createHash("sha256").update(dedupeKey).digest();
  let out = "";
  for (let i = 0; i < 10; i++) out += CROCKFORD[bytes[i] % 32];
  return `VL-${out.slice(0, 5)}-${out.slice(5)}`;
}

export const dedupeKeyOf = (lead: Lead): string => (lead.idempotencyKey && KEY.test(lead.idempotencyKey) ? `k:${lead.idempotencyKey}` : `f:${fingerprintOf(lead)}`);
export const newIdempotencyKey = () => randomUUID();

const log = (event: string, data: Record<string, unknown>) => console.info(JSON.stringify({ event, ...data }));

/** One delivery attempt for one enquiry. Never logs personal details. */
async function attempt(lead: Lead, reference: string, dedupeKey: string, attemptNo: number): Promise<DeliveryResult & { destination: string }> {
  const resolved = await resolveDestination();
  if (resolved.kind === "none") return { ok: false, retryable: false, status: 503, message: resolved.reason, destination: "none" };
  const destination = resolved.kind === "demo" ? demoDestination : resolved.destination;
  if (!destination.accepts(lead)) return { ok: false, retryable: false, status: 503, message: "This destination does not accept this enquiry.", destination: destination.id };
  const result = await destination.send(lead, { reference, idempotencyKey: dedupeKey.replace(/^[kf]:/, ""), attempt: attemptNo }).catch((error: unknown): DeliveryResult => ({ ok: false, retryable: true, status: 503, message: error instanceof Error ? error.message.slice(0, 160) : "unreachable" }));
  return { ...result, destination: destination.id };
}

/**
 * Accepts an enquiry. The customer is told it succeeded only when it was delivered to a real destination or durably stored for
 * delivery (DATABASE_URL). With no store, delivery is synchronous: a failure is reported honestly and the form keeps what the customer typed.
 */
export async function submitLead(input: Lead, opts: { store?: LeadStore | null } = {}): Promise<SubmitOutcome> {
  const store = opts.store === undefined ? leadStore() : opts.store;
  const lead: Lead = { ...input, submittedAt: new Date().toISOString() };
  const dedupeKey = dedupeKeyOf(lead);
  const reference = referenceFor(dedupeKey);
  const type = enquiryTypeOf(lead);

  const resolved = await resolveDestination();
  if (resolved.kind === "none") {
    log("enquiry_not_configured", { type, reason: resolved.reason });
    return { ok: false, status: 503, code: "not_configured", message: `Online enquiries are not available on this website at the moment. ${CONTACT}` };
  }
  if (resolved.kind === "demo") {
    await demoDestination.send(lead, { reference: `DEMO-${reference.slice(3)}`, idempotencyKey: dedupeKey, attempt: 1 });
    return { ok: true, reference: `DEMO-${reference.slice(3)}`, delivered: false, duplicate: false, demo: true };
  }

  if (!store) {
    const result = await attempt(lead, reference, dedupeKey, 1);
    if (result.ok) {
      log("enquiry_delivered", { type, reference, destination: result.destination, stored: false });
      return { ok: true, reference: result.reference ?? reference, delivered: true, duplicate: false };
    }
    log("enquiry_failed", { type, reference, destination: result.destination, status: result.status, retryable: result.retryable, stored: false });
    return result.retryable
      ? { ok: false, status: 503, code: "delivery_failed", message: `We could not send your enquiry just now. Your details are still in the form, so you can try again in a moment. ${CONTACT}` }
      : { ok: false, status: result.status === 404 || result.status === 422 ? result.status : 503, code: "rejected", message: result.message, fields: result.fields };
  }

  let record: LeadRecord;
  let created: boolean;
  try {
    ({ record, created } = await store.create({ reference, dedupeKey, fingerprint: fingerprintOf(lead), lead }));
  } catch (error) {
    // The enquiry could not be made durable, so it has not been accepted. Say so.
    log("enquiry_store_unavailable", { type, message: error instanceof Error ? error.message.slice(0, 160) : "unknown" });
    return { ok: false, status: 503, code: "unavailable", message: `We could not record your enquiry just now. Please try again in a moment. ${CONTACT}` };
  }
  if (!created) return { ok: true, reference: record.reference, delivered: record.status === "delivered", duplicate: true };

  // First attempt now. If it fails temporarily the enquiry stays queued and the customer is still correctly told it was received.
  const claimed = await store.claim(record.id);
  const first = claimed ? await deliverRecord(store, claimed) : null;
  if (first?.outcome === "rejected") {
    const status = first.status === 404 ? 404 : 422;
    return { ok: false, status, code: "rejected", message: status === 404 ? "This vehicle is no longer available. Please ask us about similar cars." : first.message ?? "This enquiry could not be accepted.", fields: first.fields };
  }
  return { ok: true, reference: first?.reference ?? record.reference, delivered: first?.outcome === "delivered", duplicate: false };
}

type DeliveryOutcome = { outcome: "delivered" | "retrying" | "failed" | "rejected"; reference?: string; status?: number; message?: string; fields?: Record<string, string> };

/** Delivers one claimed enquiry and records the outcome. Used for the first attempt and for retries. */
export async function deliverRecord(store: LeadStore, record: LeadRecord): Promise<DeliveryOutcome> {
  if (!record.lead) {
    await store.markRejected(record, null, "The enquiry details were removed before delivery.");
    return { outcome: "rejected" };
  }
  const result = await attempt(record.lead, record.reference, record.dedupeKey, record.attempts + 1);
  await store.recordAttempt(record, result.destination, result.ok ? { ok: true } : { ok: false, status: result.status, error: result.message }).catch(() => undefined);
  if (result.ok) {
    await store.markDelivered(record, result.destination, result.reference);
    log("enquiry_delivered", { type: enquiryTypeOf(record.lead), reference: record.reference, destination: result.destination, attempts: record.attempts + 1, stored: true });
    // The customer keeps the website reference; the destination's own id is stored for staff.
    return { outcome: "delivered", reference: record.reference };
  }
  if (!result.retryable) {
    await store.markRejected(record, result.destination, result.message);
    log("enquiry_rejected", { reference: record.reference, destination: result.destination, status: result.status });
    return { outcome: "rejected", status: result.status, message: result.message, fields: result.fields };
  }
  const next = await store.markRetry(record, result.destination, result.message);
  log(next === "failed" ? "enquiry_dead_letter" : "enquiry_retry_scheduled", { reference: record.reference, destination: result.destination, status: result.status, attempts: record.attempts + 1, max: MAX_ATTEMPTS });
  return { outcome: next };
}

/** Delivers every enquiry that is due. Called by the scheduled job and opportunistically after each submission. */
export async function retryDue(store: LeadStore, limit = 25): Promise<{ attempted: number; delivered: number; failed: number }> {
  const due = await store.claimDue(limit);
  let delivered = 0;
  let failed = 0;
  for (const record of due) {
    const { outcome } = await deliverRecord(store, record);
    if (outcome === "delivered") delivered++;
    else if (outcome === "failed" || outcome === "rejected") failed++;
  }
  return { attempted: due.length, delivered, failed };
}
