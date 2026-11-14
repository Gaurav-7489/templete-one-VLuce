import type { Metadata } from "next";
import { CompareView } from "@/components/CompareView";
import { getInventory } from "@/lib/inventory";

export const metadata: Metadata = { title: "Compare Cars", robots: { index: false } };
export const revalidate = 300;

export default async function ComparePage() {
  return (
    <div className="theme-light">
      <div className="wrap">
        <div className="lhead">
          <div>
            <h1>Compare Cars</h1>
            <p>Up to three cars side by side. Saved on this device.</p>
          </div>
        </div>
        <CompareView vehicles={await getInventory()} />
      </div>
    </div>
  );
}
