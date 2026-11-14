import type { Metadata } from "next";
import Link from "next/link";
import { ShortlistView } from "@/components/ShortlistView";
import { getInventory } from "@/lib/inventory";

export const metadata: Metadata = { title: "Your Shortlist", robots: { index: false } };
export const revalidate = 300;

export default async function ShortlistPage() {
  const vehicles = await getInventory();
  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <div className="page-hero__row">
            <ol className="crumbs" aria-label="Breadcrumb">
              <li><Link href="/">Home</Link></li>
              <li aria-current="page">Shortlist</li>
            </ol>
            <h1 className="display h-xl">Your <em>Shortlist</em></h1>
            <p className="lead">Saved on this device. Share it with us on WhatsApp, and we will prepare them for a viewing.</p>
          </div>
        </div>
      </section>
      <section className="section section--tight">
        <div className="wrap">
          <ShortlistView vehicles={vehicles} />
        </div>
      </section>
    </>
  );
}
