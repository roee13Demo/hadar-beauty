/**
 * Bulk-to-unit cost math.
 * cost_per_unit = bulk_cost_ils / bulk_quantity
 * stock_value   = current_stock_units × cost_per_unit
 */

export interface UnitCostInput {
  bulkCost: number;
  bulkQuantity: number;
  currentStock: number;
}

export interface UnitCostBreakdown {
  costPerUnit: number;
  stockValue: number;
}

export function computeUnitCost(input: UnitCostInput): UnitCostBreakdown {
  const { bulkCost, bulkQuantity, currentStock } = input;
  const safeQty = bulkQuantity > 0 ? bulkQuantity : 0;
  const costPerUnit = safeQty > 0 ? bulkCost / safeQty : 0;
  const stockValue = currentStock * costPerUnit;
  return { costPerUnit, stockValue };
}

export interface CogsContributionInput {
  unitsConsumedPerService: number;
  costPerUnit: number;
}

/** Per-service COGS contribution from a single inventory item. */
export function computeCogsContribution({
  unitsConsumedPerService,
  costPerUnit,
}: CogsContributionInput): number {
  if (
    !Number.isFinite(unitsConsumedPerService) ||
    !Number.isFinite(costPerUnit)
  ) {
    return 0;
  }
  return unitsConsumedPerService * costPerUnit;
}
