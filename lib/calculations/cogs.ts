/**
 * Computes the Cost of Goods Sold (COGS) for a service by walking its
 * service_materials linkage and summing each linked inventory item's
 * (units_consumed × cost_per_unit).
 *
 * The result is the snapshot value we store on a Transaction row at save time.
 */

import { getDB } from "@/lib/db/schema";
import { computeCogsContribution } from "./unit-cost";

export interface ServiceCogsBreakdown {
  total: number;
  contributions: Array<{
    inventory_item_id: string;
    inventory_name_he: string;
    units_consumed: number;
    unit_cost: number;
    line_total: number;
  }>;
}

export async function computeServiceCogs(
  serviceId: string,
): Promise<ServiceCogsBreakdown> {
  const db = getDB();
  const links = await db.service_materials
    .where("service_id")
    .equals(serviceId)
    .toArray();

  if (links.length === 0) {
    return { total: 0, contributions: [] };
  }

  const items = await Promise.all(
    links.map((l) => db.inventory_items.get(l.inventory_item_id)),
  );

  const contributions = links
    .map((link, idx) => {
      const item = items[idx];
      if (!item) return null;
      const lineTotal = computeCogsContribution({
        unitsConsumedPerService: link.units_consumed_per_service,
        costPerUnit: item.cost_per_unit,
      });
      return {
        inventory_item_id: link.inventory_item_id,
        inventory_name_he: item.name_he,
        units_consumed: link.units_consumed_per_service,
        unit_cost: item.cost_per_unit,
        line_total: lineTotal,
      };
    })
    .filter(<T,>(x: T | null): x is T => x !== null);

  const total = contributions.reduce((sum, c) => sum + c.line_total, 0);

  return { total, contributions };
}
