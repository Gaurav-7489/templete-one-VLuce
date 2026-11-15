/**
 * How this deployment handles enquiries. The one rule: a customer is never told "we have your enquiry" unless it
 * was delivered to a real destination or durably stored for delivery. Demo mode is the only exception, and it must be asked for.
 */

export type LeadMode = "auto" | "vandlabs" | "webhook" | "demo";

export const leadMode = (): LeadMode => {
  const v = (process.env.LEAD_DESTINATION ?? "auto").trim().toLowerCase();
  return v === "vandlabs" || v === "webhook" || v === "demo" ? v : "auto";
};

export const isProduction = () => process.env.NODE_ENV === "production";

/**
 * Demo mode (enquiries accepted but sent nowhere, and the visitor is told so) is available when:
 *  - LEAD_DESTINATION=demo is set explicitly, in any environment; or
 *  - nothing is configured and the site is running outside production (local development).
 * A production deployment with no destination reports a configuration error instead.
 */
export const demoAllowed = () => leadMode() === "demo" || (leadMode() === "auto" && !isProduction());

export const webhookUrl = () => (process.env.LEAD_WEBHOOK_URL ?? "").trim();

export const MAX_ATTEMPTS = 8;
export const BACKOFF_BASE_SECONDS = 30;
export const BACKOFF_CAP_SECONDS = 6 * 3600;

/** Exponential backoff with jitter: ~30s, 1m, 2m, 4m … capped at six hours. */
export function backoffSeconds(attempt: number, random: () => number = Math.random): number {
  const base = Math.min(BACKOFF_CAP_SECONDS, BACKOFF_BASE_SECONDS * 2 ** Math.max(0, attempt - 1));
  return Math.round(base * (0.75 + random() * 0.5));
}
