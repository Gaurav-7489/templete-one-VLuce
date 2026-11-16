import { Pool } from "pg";
import { LeadStore } from "./store";

let store: LeadStore | null | undefined;
let override: LeadStore | null | undefined;

/** Test hook: use a specific store (or none) regardless of the environment. */
export function setLeadStoreForTests(value: LeadStore | null | undefined) {
  override = value;
}

/**
 * The durable store, or null when this deployment has no DATABASE_URL. A website that does not use one still works:
 * enquiries are then delivered synchronously and only acknowledged once delivered.
 */
export function leadStore(): LeadStore | null {
  if (override !== undefined) return override;
  if (store !== undefined) return store;
  const url = process.env.DATABASE_URL?.trim();
  if (!url) return (store = null);
  const pool = new Pool({ connectionString: url, max: 3, idleTimeoutMillis: 10_000, connectionTimeoutMillis: 5_000 });
  pool.on("error", (error) => console.error(JSON.stringify({ event: "lead_store_pool_error", message: error.message })));
  return (store = new LeadStore(pool));
}
