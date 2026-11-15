import { dealership } from "@/config/dealership";
import { siteUrl } from "./site";
import type { Vehicle } from "./types";

/**
 * Structured data shared by every template. Only facts the dealership has configured, or the inventory source states, are
 * published: no ratings, reviews, invented opening-hours formats or availability the stock does not have.
 */

export const dealerId = `${siteUrl}/#dealer`;

export function dealerJsonLd() {
  const s = dealership.showroom;
  return {
    "@context": "https://schema.org",
    "@type": "AutoDealer",
    "@id": dealerId,
    name: dealership.name,
    description: dealership.description,
    url: siteUrl,
    telephone: dealership.contact.phone,
    email: dealership.contact.email,
    image: s.image,
    address: { "@type": "PostalAddress", streetAddress: s.addressLines.join(", "), addressLocality: s.city, addressRegion: s.region, postalCode: s.postalCode, addressCountry: s.country },
    ...(s.geo && { geo: { "@type": "GeoCoordinates", latitude: s.geo.lat, longitude: s.geo.lng } }),
    areaServed: { "@type": "City", name: s.city },
    sameAs: dealership.social.map((x) => x.href).filter((h) => !/^https:\/\/(www\.)?[a-z]+\.com\/?$/.test(h)),
  };
}

/** Schema.org ItemAvailability for a listed car. A reserved car is not offered as in stock. */
export const availabilityUrl = (a: Vehicle["availability"]) =>
  a === "available" ? "https://schema.org/InStock" : a === "reserved" ? "https://schema.org/Reserved" : a === "sold" ? "https://schema.org/SoldOut" : "https://schema.org/PreOrder";

export function vehicleJsonLd(v: Vehicle, title: string) {
  const url = `${siteUrl}/collection/${v.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "Car",
    name: title,
    brand: { "@type": "Brand", name: v.brand },
    model: v.model,
    vehicleConfiguration: v.variant || undefined,
    vehicleModelDate: String(v.year),
    mileageFromOdometer: { "@type": "QuantitativeValue", value: v.km, unitCode: "KMT" },
    fuelType: v.fuel,
    vehicleTransmission: v.transmission,
    color: v.exterior || undefined,
    vehicleInteriorColor: v.interior || undefined,
    bodyType: v.bodyType || undefined,
    numberOfPreviousOwners: v.owners,
    itemCondition: "https://schema.org/UsedCondition",
    image: v.images.length ? v.images : undefined,
    sku: v.stockId,
    url,
    description: v.description || undefined,
    offers: v.price ? { "@type": "Offer", url, price: v.price, priceCurrency: "INR", availability: availabilityUrl(v.availability), seller: { "@id": dealerId } } : undefined,
  };
}

/** BreadcrumbList matching the visible breadcrumb trail. */
export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: `${siteUrl}${it.path}` })),
  };
}

/** Short, factual answers built only from the dealership's configuration, shown on the page and marked up as FAQPage. */
export function showroomFaq(): { q: string; a: string }[] {
  const s = dealership.showroom;
  const hours = s.hours.map((h) => `${h.days}: ${h.time}`).join("; ");
  return [
    { q: `Where is ${dealership.name}?`, a: `${s.name}, ${s.addressLines.join(", ")}, ${s.city} ${s.postalCode}.` },
    { q: "When is the showroom open?", a: hours },
    { q: "How do I book a viewing or test drive?", a: `Use the form on any car's page or this page, call ${dealership.contact.phone}, or message us on WhatsApp. We confirm every appointment personally.` },
    { q: "Do you buy cars?", a: `Yes. Share your car's details on the Sell Your Car page and ${dealership.name} will arrange an inspection.` },
  ];
}

export const faqJsonLd = (faq: { q: string; a: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
});

/** Safe inline JSON-LD: `<` is escaped so content can never close the script tag. */
export const ldScript = (data: unknown) => ({ __html: JSON.stringify(data).replace(/</g, "\\u003c") });
