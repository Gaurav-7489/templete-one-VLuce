import type { Metadata, Viewport } from "next";
import { Inter, Instrument_Serif, Manrope } from "next/font/google";
import { Attribution } from "@/components/Attribution";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Intro } from "@/components/motion/Intro";
import { ScrollProgress } from "@/components/motion/ScrollProgress";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import { dealership } from "@/config/dealership";
import { brandOrder } from "@/data/catalog";
import { getBrands } from "@/lib/inventory";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin"], weight: ["200", "300", "400", "500"], variable: "--font-manrope", display: "swap" });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-inter", display: "swap" });
const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-serif-accent", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: `${dealership.name} — ${dealership.tagline}`, template: `%s · ${dealership.name}` },
  description: dealership.description,
  openGraph: { type: "website", siteName: dealership.name, locale: "en_IN", images: [{ url: dealership.home.heroImage, width: 2400, height: 1600 }] },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = { themeColor: "#0b1020", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const stock = (await getBrands()).sort((a, b) => (brandOrder.indexOf(a.brand) + 1 || 99) - (brandOrder.indexOf(b.brand) + 1 || 99));
  const brands = stock.map((b) => b.brand);
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
    <html lang="en-IN" className={`${manrope.variable} ${inter.variable} ${serif.variable}`}>
      <body>
        <SmoothScroll>
          <a href="#main" className="skip-link">Skip to content</a>
          <ScrollProgress />
          <Intro wordmark={dealership.wordmark} descriptor={dealership.descriptor} />
          <Header brands={stock} />
          <main id="main">{children}</main>
          <Footer brands={brands} />
          <WhatsAppFab />
          <Attribution />
        </SmoothScroll>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(org).replace(/</g, "\\u003c") }} />
      </body>
    </html>
  );
}
