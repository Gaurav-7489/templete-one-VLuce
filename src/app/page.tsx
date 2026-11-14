import { BrandIndex } from "@/components/home/Brands";
import { Closing } from "@/components/home/Closing";
import { CollectionPreview } from "@/components/home/Collection";
import { Experience } from "@/components/home/Experience";
import { Featured } from "@/components/home/Featured";
import { Hero } from "@/components/home/Hero";
import { LifestyleIndex } from "@/components/home/Lifestyle";
import { SellTeaser } from "@/components/home/Sell";
import { ShowroomTeaser } from "@/components/home/Showroom";
import { brandOrder } from "@/data/catalog";
import { applyFilters } from "@/lib/filters";
import { getInventory } from "@/lib/inventory";

export const revalidate = 300;

export default async function Home() {
  const all = applyFilters(await getInventory(), {});
  const featured = all.find((v) => v.featured && v.availability === "available") ?? all[0];
  const preview = all.filter((v) => v !== featured && v.availability !== "coming-soon").slice(0, 6);

  const counts = new Map<string, number>();
  for (const v of all) counts.set(v.brand, (counts.get(v.brand) ?? 0) + 1);
  const known = brandOrder.map((brand) => ({ brand, count: counts.get(brand) ?? 0 }));
  const extra = [...counts].filter(([b]) => !brandOrder.includes(b)).map(([brand, count]) => ({ brand, count }));
  // Brands with stock come first; configured brands without stock show as "arriving soon".
  const brands = [...known, ...extra].sort((a, b) => Number(b.count > 0) - Number(a.count > 0));

  const lifeCounts: Record<string, number> = {};
  for (const v of all) for (const l of v.lifestyle) lifeCounts[l] = (lifeCounts[l] ?? 0) + 1;

  return (
    <>
      <Hero count={all.length} />
      {all.length > 0 && (
        <div className="marquee" aria-hidden="true">
          <div className="marquee__track">
            {[0, 1].map((k) => (
              <span key={k} style={{ display: "inline-flex", gap: 56 }}>
                {brands.filter((b) => b.count).map((b) => (
                  <span key={b.brand}>{b.brand}</span>
                ))}
              </span>
            ))}
          </div>
        </div>
      )}
      {preview.length > 0 && <CollectionPreview vehicles={preview} total={all.length} />}
      {brands.length > 0 && <BrandIndex brands={brands} />}
      {featured && <Featured v={featured} />}
      <LifestyleIndex counts={lifeCounts} />
      <SellTeaser />
      <Experience />
      <ShowroomTeaser />
      <Closing />
    </>
  );
}
