import type { MetadataRoute } from "next";
import { getInventory } from "@/lib/inventory";
import { siteUrl } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = ["", "/collection", "/sell", "/showroom"].map((p) => ({ url: `${siteUrl}${p}`, changeFrequency: "weekly" as const, priority: p ? 0.8 : 1 }));
  const cars = (await getInventory()).map((v) => ({ url: `${siteUrl}/collection/${v.slug}`, changeFrequency: "daily" as const, priority: 0.7, images: v.images.slice(0, 1) }));
  return [...pages, ...cars];
}
