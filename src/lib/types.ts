export type Fuel = "Petrol" | "Diesel" | "Hybrid" | "Electric";
export type Transmission = "Automatic" | "Manual";
export type Availability = "available" | "reserved" | "coming-soon" | "sold";

export type Lifestyle = "luxury-sedans" | "suvs" | "performance" | "sports" | "electric" | "premium-hatchbacks";

export type VehicleSpecs = Partial<{
  engine: string;
  power: string;
  torque: string;
  acceleration: string;
  topSpeed: string;
  drivetrain: string;
  seats: string;
  range: string;
  battery: string;
}>;

/** The website's vehicle model. Any inventory source (demo, VandLabs, a future CMS) maps into this shape. */
export type Vehicle = {
  slug: string;
  stockId: string;
  brand: string;
  model: string;
  variant: string;
  year: number;
  /** Asking price in rupees. null means "price on request". */
  price: number | null;
  fuel: Fuel;
  transmission: Transmission;
  km: number;
  owners: number;
  bodyType: string;
  lifestyle: Lifestyle[];
  availability: Availability;
  exterior: string;
  interior: string;
  city: string;
  /** State of registration, e.g. "KA". Never the registration number. */
  registration?: string;
  images: string[];
  highlights: string[];
  specs: VehicleSpecs;
  description: string;
  featured?: boolean;
};

export type InventoryFilters = {
  q?: string;
  brand?: string;
  lifestyle?: Lifestyle | "";
  fuel?: Fuel | "";
  transmission?: Transmission | "";
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxKm?: number;
  sort?: SortKey;
};

export type SortKey = "featured" | "price-asc" | "price-desc" | "year-desc" | "km-asc";
