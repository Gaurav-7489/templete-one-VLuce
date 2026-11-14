import { demoVehicles } from "@/data/vehicles";
import type { InventorySource } from "./source";

/** Built-in demo stock. Used when INVENTORY_SOURCE is unset or "demo". */
export const demoSource: InventorySource = {
  id: "demo",
  async list() {
    return demoVehicles.filter((v) => v.availability !== "sold");
  },
};
