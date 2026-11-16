import { createHash } from "node:crypto";
import { BACKOFF_CAP_SECONDS, MAX_ATTEMPTS, backoffSeconds } from "./config";
import type { Lead } from "./types";

/**
 * Durable enquiry storage for website-only and connected deployments alike. It needs one thing: a PostgreSQL database
 * (DATABASE_URL). Any provider works (Neon's free tier is enough); it is not Automotive Intelligence and is not
 * required for the site to run. Without it, enquiries are delivered synchronously and never reported as received unless delivered.
 */

/** The smallest slice of a PostgreSQL client the store needs. `pg.Pool` and PGlite both satisfy it. */
export interface SqlExecutor {
  query(sql: string, params?: unknown[]): Promise<{ rows: Record<string, unknown>[] }>;
}

export type LeadStatus = "pending" | "retrying" | "delivered" | "failed" | "rejected";

export type LeadRecord = {
  id: string;
  reference: string;
  dedupeKey: string;
  kind: string;
  status: LeadStatus;
  attempts: number;
  destination: string | null;
  downstreamReference: string | null;
  lastError: string | null;
  createdAt: string;
  lead: Lead | null;
};

export type FailedLeadView = Omit<LeadRecord, "lead"> & { nextAttemptAt: string | null };

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS vluce_leads (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    reference text NOT NULL UNIQUE,
    dedupe_key text NOT NULL UNIQUE,
    fingerprint text NOT NULL,
    kind text NOT NULL,
    status text NOT NULL CHECK (status IN ('pending','retrying','delivered','failed','rejected')),
    attempts integer NOT NULL DEFAULT 0,
    next_attempt_at timestamptz NOT NULL DEFAULT now(),
    locked_until timestamptz,
    destination text,
    downstream_reference text,
    last_error text,
    payload jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    delivered_at timestamptz
  )`,
  `CREATE INDEX IF NOT EXISTS vluce_leads_due ON vluce_leads (next_attempt_at) WHERE status IN ('pending','retrying')`,
  `CREATE INDEX IF NOT EXISTS vluce_leads_fingerprint ON vluce_leads (fingerprint, created_at DESC)`,
  `CREATE TABLE IF NOT EXISTS vluce_delivery_attempts (
    id bigserial PRIMARY KEY,
    lead_id uuid NOT NULL REFERENCES vluce_leads(id) ON DELETE CASCADE,
    at timestamptz NOT NULL DEFAULT now(),
    destination text NOT NULL,
    ok boolean NOT NULL,
    http_status integer,
    error text
  )`,
  `CREATE TABLE IF NOT EXISTS vluce_rate_limits (
    key_hash text PRIMARY KEY,
    window_ends_at timestamptz NOT NULL,
    hits integer NOT NULL
  )`,
];

const iso = (v: unknown) => (v ? new Date(String(v)).toISOString() : null);
const sha = (s: string) => createHash("sha256").update(s).digest("hex");

const toRecord = (r: Record<string, unknown>): LeadRecord => ({
  id: String(r.id),
  reference: String(r.reference),
  dedupeKey: String(r.dedupe_key),
  kind: String(r.kind),
  status: r.status as LeadStatus,
  attempts: Number(r.attempts),
  destination: (r.destination as string | null) ?? null,
  downstreamReference: (r.downstream_reference as string | null) ?? null,
  lastError: (r.last_error as string | null) ?? null,
  createdAt: iso(r.created_at)!,
  lead: (r.payload as Lead | null) ?? null,
});

export class LeadStore {
  private ready: Promise<void> | null = null;
  constructor(private readonly db: SqlExecutor) {}

  /** Creates the tables on first use. Safe to run repeatedly and from many instances. */
  ensureSchema(): Promise<void> {
    this.ready ??= (async () => {
      for (const sql of SCHEMA) await this.db.query(sql);
    })().catch((error) => {
      this.ready = null;
      throw error;
    });
    return this.ready;
  }

  /**
   * Stores an enquiry once. The same dedupe key, or the same person asking the same thing within `windowMinutes`,
   * returns the existing record instead of creating another.
   */
  async create(input: { reference: string; dedupeKey: string; fingerprint: string; lead: Lead }, windowMinutes = 10): Promise<{ record: LeadRecord; created: boolean }> {
    await this.ensureSchema();
    const near = (await this.db.query(
      "SELECT * FROM vluce_leads WHERE (dedupe_key = $1 OR (fingerprint = $2 AND created_at > now() - make_interval(mins => $3) AND status <> 'rejected')) ORDER BY created_at LIMIT 1",
      [input.dedupeKey, input.fingerprint, windowMinutes],
    )).rows[0];
    if (near) return { record: toRecord(near), created: false };
    const inserted = (await this.db.query(
      "INSERT INTO vluce_leads (reference, dedupe_key, fingerprint, kind, status, payload) VALUES ($1, $2, $3, $4, 'pending', $5::jsonb) ON CONFLICT (dedupe_key) DO NOTHING RETURNING *",
      [input.reference, input.dedupeKey, input.fingerprint, input.lead.kind, JSON.stringify(input.lead)],
    )).rows[0];
    if (inserted) return { record: toRecord(inserted), created: true };
    // Two identical submissions raced; the other one won.
    return { record: toRecord((await this.db.query("SELECT * FROM vluce_leads WHERE dedupe_key = $1", [input.dedupeKey])).rows[0]), created: false };
  }

  /** Takes up to `limit` enquiries that are due and holds them for `leaseSeconds`, so two instances never deliver the same one. */
  async claimDue(limit: number, leaseSeconds = 120): Promise<LeadRecord[]> {
    await this.ensureSchema();
    const rows = (await this.db.query(
      `UPDATE vluce_leads SET locked_until = now() + make_interval(secs => $2)
       WHERE id IN (SELECT id FROM vluce_leads WHERE status IN ('pending','retrying') AND next_attempt_at <= now() AND (locked_until IS NULL OR locked_until < now()) ORDER BY next_attempt_at LIMIT $1 FOR UPDATE SKIP LOCKED)
       RETURNING *`,
      [limit, leaseSeconds],
    )).rows;
    return rows.map(toRecord);
  }

  /** Takes one specific enquiry for an immediate first attempt. */
  async claim(id: string, leaseSeconds = 60): Promise<LeadRecord | null> {
    const row = (await this.db.query(
      "UPDATE vluce_leads SET locked_until = now() + make_interval(secs => $2) WHERE id = $1 AND status IN ('pending','retrying') AND (locked_until IS NULL OR locked_until < now()) RETURNING *",
      [id, leaseSeconds],
    )).rows[0];
    return row ? toRecord(row) : null;
  }

  async recordAttempt(record: LeadRecord, destination: string, outcome: { ok: boolean; status?: number; error?: string }): Promise<void> {
    await this.db.query("INSERT INTO vluce_delivery_attempts (lead_id, destination, ok, http_status, error) VALUES ($1, $2, $3, $4, $5)", [record.id, destination, outcome.ok, outcome.status ?? null, outcome.error?.slice(0, 300) ?? null]);
  }

  async markDelivered(record: LeadRecord, destination: string, downstreamReference?: string): Promise<void> {
    await this.db.query(
      "UPDATE vluce_leads SET status = 'delivered', attempts = attempts + 1, destination = $2, downstream_reference = $3, last_error = NULL, locked_until = NULL, delivered_at = now(), updated_at = now() WHERE id = $1",
      [record.id, destination, downstreamReference ?? null],
    );
  }

  /** A temporary failure schedules the next attempt with backoff; after MAX_ATTEMPTS the enquiry becomes `failed` and waits for staff. */
  async markRetry(record: LeadRecord, destination: string | null, error: string): Promise<"retrying" | "failed"> {
    const attempts = record.attempts + 1;
    const dead = attempts >= MAX_ATTEMPTS;
    const delay = Math.min(BACKOFF_CAP_SECONDS, backoffSeconds(attempts));
    await this.db.query(
      "UPDATE vluce_leads SET status = $2, attempts = $3, destination = coalesce($4, destination), last_error = $5, locked_until = NULL, next_attempt_at = now() + make_interval(secs => $6), updated_at = now() WHERE id = $1",
      [record.id, dead ? "failed" : "retrying", attempts, destination, error.slice(0, 300), delay],
    );
    return dead ? "failed" : "retrying";
  }

  /** A destination refused the enquiry for good (for example the vehicle was sold). It will not be retried. */
  async markRejected(record: LeadRecord, destination: string | null, error: string): Promise<void> {
    await this.db.query("UPDATE vluce_leads SET status = 'rejected', attempts = attempts + 1, destination = coalesce($2, destination), last_error = $3, locked_until = NULL, updated_at = now() WHERE id = $1", [record.id, destination, error.slice(0, 300)]);
  }

  /** Dead-letter list for staff: no names, phone numbers or messages, only what is needed to find and act on the enquiry. */
  async listFailed(limit = 50): Promise<FailedLeadView[]> {
    await this.ensureSchema();
    const rows = (await this.db.query("SELECT * FROM vluce_leads WHERE status IN ('failed','retrying') AND attempts > 0 ORDER BY created_at DESC LIMIT $1", [limit])).rows;
    return rows.map((r) => {
      const { lead, ...rest } = toRecord(r);
      void lead;
      return { ...rest, nextAttemptAt: iso(r.next_attempt_at) };
    });
  }

  /** Puts a failed enquiry back in the queue immediately. */
  async requeue(reference: string): Promise<boolean> {
    await this.ensureSchema();
    return (await this.db.query("UPDATE vluce_leads SET status = 'retrying', attempts = 0, next_attempt_at = now(), locked_until = NULL, updated_at = now() WHERE reference = $1 AND status IN ('failed','rejected') AND payload IS NOT NULL RETURNING id", [reference])).rows.length > 0;
  }

  /** The delivered enquiry's personal details are no longer needed once it is in the dealership's system. */
  async scrubDelivered(olderThanDays = 7): Promise<number> {
    await this.ensureSchema();
    return (await this.db.query("UPDATE vluce_leads SET payload = NULL WHERE status = 'delivered' AND payload IS NOT NULL AND delivered_at < now() - make_interval(days => $1) RETURNING id", [olderThanDays])).rows.length;
  }

  async counts(): Promise<Record<string, number>> {
    await this.ensureSchema();
    const rows = (await this.db.query("SELECT status, count(*)::int AS n FROM vluce_leads GROUP BY 1")).rows;
    return Object.fromEntries(rows.map((r) => [String(r.status), Number(r.n)]));
  }

  /** Fixed-window limiter shared by every instance of the site. The key is hashed, so no address is stored. */
  async hit(key: string, limit: number, windowMs: number): Promise<{ allowed: boolean; retryAfter: number }> {
    await this.ensureSchema();
    const seconds = Math.max(1, Math.ceil(windowMs / 1000));
    const row = (await this.db.query(
      `INSERT INTO vluce_rate_limits AS t (key_hash, window_ends_at, hits) VALUES ($1, now() + make_interval(secs => $2), 1)
       ON CONFLICT (key_hash) DO UPDATE SET
         hits = CASE WHEN t.window_ends_at <= now() THEN 1 ELSE t.hits + 1 END,
         window_ends_at = CASE WHEN t.window_ends_at <= now() THEN now() + make_interval(secs => $2) ELSE t.window_ends_at END
       RETURNING hits, greatest(1, ceil(extract(epoch FROM (window_ends_at - now()))))::int AS retry_after`,
      [sha(key), seconds],
    )).rows[0];
    if (Math.random() < 0.01) await this.db.query("DELETE FROM vluce_rate_limits WHERE window_ends_at < now() - interval '1 hour'").catch(() => undefined);
    const hits = Number(row.hits);
    return { allowed: hits <= limit, retryAfter: hits <= limit ? 0 : Number(row.retry_after) };
  }
}

/** The same person asking the same thing: used to collapse double submissions from different tabs or devices. */
export function fingerprintOf(lead: Lead): string {
  const day = new Date(Date.now() + 330 * 60_000).toISOString().slice(0, 10);
  return sha([lead.kind, lead.stockId ?? "", lead.intent ?? "", lead.phone.replace(/\D/g, "").slice(-10), day].join("|"));
}
