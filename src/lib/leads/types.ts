export type LeadKind = "vehicle" | "sell" | "visit" | "general";
export type VehicleIntent = "call" | "whatsapp" | "test-drive" | "price";

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
};

export type LeadResult =
  | { ok: true; reference: string; destination: string; demo?: boolean }
  | { ok: false; status: number; message: string; fields?: Record<string, string> };

export interface LeadDestination {
  readonly id: string;
  /** Whether this destination accepts this kind of lead. */
  accepts(lead: Lead): boolean;
  send(lead: Lead): Promise<LeadResult>;
}
