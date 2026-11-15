export type LeadKind = "vehicle" | "sell" | "visit" | "general";
export type VehicleIntent = "call" | "whatsapp" | "test-drive" | "price";

/**
 * The integration contract's enquiry types. Every template maps its own forms onto these, so a destination
 * (Intelligence, a webhook, a CRM) never needs to know which template produced the enquiry.
 */
export const ENQUIRY_TYPES = ["vehicle", "callback", "test_drive", "price", "sell", "visit", "general", "whatsapp"] as const;
export type EnquiryType = (typeof ENQUIRY_TYPES)[number];

/** A validated enquiry from the website. */
export type Lead = {
  kind: LeadKind;
  name: string;
  phone: string;
  email?: string;
  message?: string;
  intent?: VehicleIntent;
  /** Vehicle enquiries only. */
  stockId?: string;
  vehicleTitle?: string;
  /** Sell-your-car enquiries only. */
  sell?: { brand: string; model: string; variant?: string; year: number; km: number; owners?: number; city?: string; expectedPrice?: number };
  /** Showroom visits only. */
  visit?: { date?: string; time?: string };
  consent: true;
  marketing: boolean;
  /** Attribution captured from the landing URL. */
  utm: { source?: string; medium?: string; campaign?: string };
  page?: string;
  /** Referring site (host only), captured when the visitor first arrived. */
  referrer?: string;
  /** Set by the server: when the enquiry was accepted, and the consent timestamp recorded with it. */
  submittedAt?: string;
  /** Client-generated key that makes a retried submission harmless. */
  idempotencyKey?: string;
};

export const enquiryTypeOf = (lead: Pick<Lead, "kind" | "intent">): EnquiryType => {
  if (lead.kind === "sell") return "sell";
  if (lead.kind === "visit") return "visit";
  if (lead.kind === "general") return "general";
  if (lead.intent === "test-drive") return "test_drive";
  if (lead.intent === "price") return "price";
  if (lead.intent === "whatsapp") return "whatsapp";
  if (lead.intent === "call") return "callback";
  return "vehicle";
};

/** What a destination tells us after one delivery attempt. */
export type DeliveryResult =
  | { ok: true; reference?: string }
  /** `retryable` failures (timeouts, 5xx, 429) are safe to try again later; the others will never succeed as sent. */
  | { ok: false; retryable: boolean; status: number; message: string; fields?: Record<string, string> };

/** Context handed to a destination with every attempt, so it can pass the same identifiers downstream. */
export type DeliveryContext = { reference: string; idempotencyKey: string; attempt: number };

export interface LeadDestination {
  readonly id: string;
  /** Whether this destination accepts this kind of lead. */
  accepts(lead: Lead): boolean;
  send(lead: Lead, ctx: DeliveryContext): Promise<DeliveryResult>;
}

/** What the enquiry endpoint tells the customer. A success is only ever returned for an enquiry that was delivered or durably stored. */
export type SubmitOutcome =
  | { ok: true; reference: string; delivered: boolean; duplicate: boolean; demo?: boolean }
  | { ok: false; status: number; code: string; message: string; fields?: Record<string, string> };
