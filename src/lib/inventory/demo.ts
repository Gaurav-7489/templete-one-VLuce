import { demoVehicles } from "@/data/vehicles";
import type { InventorySource } from "./source";

/** Demo photos of cabins; listed separately so the vehicle page can offer an Interior tab. */
const INTERIOR = ["1502877338535-766e1452684a", "1503736334956-4c8f8e92946d"];
const isInterior = (url: string) => INTERIOR.some((id) => url.includes(id));

/** Built-in demo stock. Used when INVENTORY_SOURCE is unset or "demo". */
export const demoSource: InventorySource = {
  id: "demo",
  async list() {
    return demoVehicles
      .filter((v) => v.availability !== "sold")
      .map((v) => ({ ...v, images: v.images.filter((i) => !isInterior(i)), interiorImages: v.images.filter(isInterior) }));
  },
};
