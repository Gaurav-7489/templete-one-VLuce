/**
 * Dealership configuration — the single file a new client deployment edits first.
 *
 * Everything customer-facing that identifies the dealership lives here: name, contact,
 * showroom, hours, social links, homepage copy and imagery. Components never hard-code these.
 * See docs/CUSTOMIZATION.md.
 */

export type Hours = { days: string; time: string };

export type DealershipConfig = {
  name: string;
  /** Short wordmark shown in the header. */
  wordmark: string;
  /** Small line under the wordmark. */
  descriptor: string;
  tagline: string;
  description: string;
  currency: "INR";
  locale: string;
  contact: {
    phone: string;
    /** International format digits only, used for tel: and WhatsApp links. */
    phoneE164: string;
    whatsappE164: string;
    email: string;
  };
  showroom: {
    name: string;
    addressLines: string[];
    city: string;
    region: string;
    postalCode: string;
    country: string;
    /** Used for the map embed and the "Get directions" link. */
    mapQuery: string;
    geo?: { lat: number; lng: number };
    hours: Hours[];
    image: string;
  };
  social: { label: string; href: string }[];
  home: {
    heroImage: string;
    heroImageMobile?: string;
    /** Optional muted, looping video. The hero still works without it. */
    heroVideo?: string;
    heroEyebrow: string;
    heroTitle: [string, string];
    heroLead: string;
    sellImage: string;
    experienceImages: string[];
  };
  /** Subtle footer credit. Set to false for a fully white-label site. */
  showStudioCredit: boolean;
  /** Text shown with every enquiry form. Dealerships should replace it with their own privacy wording. */
  consentText: string;
};

const u = (id: string, w = 2000) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

export const dealership: DealershipConfig = {
  name: "VLuce Motor House",
  wordmark: "VLUCE",
  descriptor: "Fine Automobiles",
  tagline: "Exceptional cars. Extraordinary journeys.",
  description:
    "A curated collection of pre-owned luxury, performance and electric automobiles — presented in our Bengaluru showroom and delivered with care.",
  currency: "INR",
  locale: "en-IN",
  contact: {
    phone: "+91 80 4000 0000",
    phoneE164: "918040000000",
    whatsappE164: "918040000000",
    email: "concierge@vluce.example",
  },
  showroom: {
    name: "VLuce Showroom, Bengaluru",
    addressLines: ["No. 1, Lavelle Road", "Ashok Nagar"],
    city: "Bengaluru",
    region: "Karnataka",
    postalCode: "560001",
    country: "IN",
    mapQuery: "Lavelle Road, Ashok Nagar, Bengaluru 560001",
    geo: { lat: 12.9692, lng: 77.5986 },
    hours: [
      { days: "Monday – Saturday", time: "10:00 – 19:30" },
      { days: "Sunday", time: "11:00 – 17:00 · by appointment" },
    ],
    image: u("1562141961-b5d1857e3b4a"),
  },
  social: [
    { label: "Instagram", href: "https://instagram.com/" },
    { label: "YouTube", href: "https://youtube.com/" },
    { label: "LinkedIn", href: "https://linkedin.com/" },
  ],
  home: {
    heroImage: u("1503376780353-7e6692767b70", 2400),
    heroEyebrow: "The VLuce Collection · Bengaluru",
    heroTitle: ["Exceptional Cars.", "Extraordinary Journeys."],
    heroLead: "Pre-owned luxury and performance automobiles, chosen one at a time.",
    sellImage: u("1492144534655-ae79c964c9d7"),
    experienceImages: [u("1568605117036-5fe5e7bab0b7", 1400), u("1502877338535-766e1452684a", 1400), u("1580273916550-e323be2ae537", 1400)],
  },
  showStudioCredit: true,
  consentText:
    "I agree that the dealership may contact me by phone, WhatsApp or email about this enquiry.",
};
