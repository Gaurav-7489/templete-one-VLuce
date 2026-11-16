import { PGlite } from "@electric-sql/pglite";
import { LeadStore, type SqlExecutor } from "../src/lib/leads/store";
import type { Lead } from "../src/lib/leads/types";

export async function pgStore(): Promise<{ store: LeadStore; db: PGlite }> {
  const db = new PGlite();
  await db.waitReady;
  const exec: SqlExecutor = { query: async (sql, params) => ({ rows: (await db.query<Record<string, unknown>>(sql, params as unknown[])).rows }) };
  return { store: new LeadStore(exec), db };
}

export type Call = { url: string; init: RequestInit; body: Record<string, unknown> };

/** Replaces global fetch. `respond` decides each answer; every call is recorded. */
export function stubFetch(respond: (call: Call) => Response | Promise<Response>): { calls: Call[]; restore(): void } {
  const original = globalThis.fetch;
  const calls: Call[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const call = { url: String(input), init, body: init.body ? JSON.parse(String(init.body)) : {} };
    calls.push(call);
    return respond(call);
  }) as typeof fetch;
  return { calls, restore: () => void (globalThis.fetch = original) };
}

export const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

export function env(vars: Record<string, string | undefined>): () => void {
  const before = Object.fromEntries(Object.keys(vars).map((k) => [k, process.env[k]]));
  for (const [k, v] of Object.entries(vars)) if (v === undefined) delete process.env[k]; else process.env[k] = v;
  return () => { for (const [k, v] of Object.entries(before)) if (v === undefined) delete process.env[k]; else process.env[k] = v; };
}

export const lead = (over: Partial<Lead> = {}): Lead => ({
  kind: "vehicle", name: "Anu Thomas", phone: "+91 98470 12345", stockId: "V-1001", intent: "test-drive", consent: true, marketing: false, utm: { source: "instagram" },
  idempotencyKey: "key-aaaaaaaaaaaaaaaaaaaa", ...over,
});
