import type { Vehicle } from "../types";

/**
 * An inventory source supplies the website's public stock. The website never depends on
 * a particular back office: the demo file, VandLabs Automotive Intelligence, or any future
 * source (a CMS, a DMS export, a spreadsheet) implements this one interface.
 */
export interface InventorySource {
  readonly id: string;
  /** All publicly listable vehicles (available, reserved or arriving). Never sold or draft stock. */
  list(): Promise<Vehicle[]>;
}
