/**
 * Service-level margin calculations.
 * Net Profit = (Gross - Tax) - COGS
 */

export interface MarginInput {
  price: number;
  materialCost: number;
  taxRate: number;
}

export interface MarginBreakdown {
  price: number;
  materialCost: number;
  taxOwed: number;
  netProfit: number;
  marginPercent: number;
  isHealthy: boolean;
}

const HEALTHY_MARGIN_THRESHOLD = 0.3;

export function computeMargin(input: MarginInput): MarginBreakdown {
  const { price, materialCost, taxRate } = input;
  const taxOwed = price * taxRate;
  const netProfit = price - materialCost - taxOwed;
  const marginPercent = price > 0 ? netProfit / price : 0;

  return {
    price,
    materialCost,
    taxOwed,
    netProfit,
    marginPercent,
    isHealthy: marginPercent >= HEALTHY_MARGIN_THRESHOLD,
  };
}

export const ISRAELI_VAT_RATE = 0.18;
