import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import { Suspense } from "react";
import { Attribution } from "@/components/Attribution";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import { dealership } from "@/config/dealership";
import { brandOrder } from "@/data/catalog";
import { getBrands } from "@/lib/inventory";
import { siteUrl } from "@/lib/site";
import "./globals.css";

// Outfit: an open-licence geometric sans. One family, weights 200 to 600, carries the whole site.
const sans = Outfit({ subsets: ["latin"], weight: ["200", "300", "400", "500", "600"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: `${dealership.name} — ${dealership.tagline}`, template: `%s · ${dealership.name}` },
  description: dealership.description,
  openGraph: { type: "website", siteName: dealership.name, locale: "en_IN", images: [{ url: dealership.home.heroImage, width: 2400, height: 1600 }] },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = { themeColor: "#000000", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const brands = (await getBrands()).map((b) => b.brand).sort((a, b) => (brandOrder.indexOf(a) + 1 || 99) - (brandOrder.indexOf(b) + 1 || 99));
  const org = {
    "@context": "https://schema.org",
    "@type": "AutoDealer",
    name: dealership.name,
    url: siteUrl,
    telephone: dealership.contact.phone,
    email: dealership.contact.email,
    image: dealership.showroom.image,
    address: {
      "@type": "PostalAddress",
      streetAddress: dealership.showroom.addressLines.join(", "),
      addressLocality: dealership.showroom.city,
      addressRegion: dealership.showroom.region,
      postalCode: dealership.showroom.postalCode,
      addressCountry: dealership.showroom.country,
    },
    ...(dealership.showroom.geo && { geo: { "@type": "GeoCoordinates", latitude: dealership.showroom.geo.lat, longitude: dealership.showroom.geo.lng } }),
    sameAs: dealership.social.map((s) => s.href),
  };
  return (
    <html lang="en-IN" className={sans.variable}>
      <body>
        <a href="#main" className="skip-link">Skip to content</a>
        <Suspense fallback={<div className="header dark" style={{ height: 121, background: "#000" }} />}>
          <Header brands={brands} />
        </Suspense>
        <main id="main">{children}</main>
        <Footer brands={brands} />
        <WhatsAppFab />
        <Attribution />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(org).replace(/</g, "\\u003c") }} />
      </body>
    </html>
  );
}
