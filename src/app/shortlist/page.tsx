import type { Metadata } from "next";
import { ShortlistView } from "@/components/ShortlistView";
import { getInventory } from "@/lib/inventory";

export const metadata: Metadata = { title: "Your Shortlist", robots: { index: false } };
export const revalidate = 300;

export default async function ShortlistPage() {
  const vehicles = await getInventory();
  return (
    <div className="theme-light">
      <section className="page-hero">
        <div className="wrap page-hero__row">
          <div>
            <span className="eyebrow">Your Shortlist</span>
            <h1 className="display h-xl" style={{ marginTop: 22 }}>Cars you <em>are considering.</em></h1>
          </div>
          <p className="lead">Saved on this device. Share it with us on WhatsApp, and we will prepare them for a viewing.</p>
        </div>
      </section>
      <section className="section section--tight">
        <div className="wrap">
          <ShortlistView vehicles={vehicles} />
        </div>
      </section>
    </div>
  );
}
