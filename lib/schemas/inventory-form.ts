import { z } from "zod";
import { he } from "@/lib/i18n/he";
import type { InventoryCategory, InventoryUnit } from "@/lib/db/schema";

export const INVENTORY_CATEGORIES: InventoryCategory[] = [
  "brows",
  "lashes",
  "facial",
  "tools",
];

export const INVENTORY_UNITS: InventoryUnit[] = [
  "ml",
  "gram",
  "piece",
  "application",
];

export const inventoryFormSchema = z.object({
  name_he: z
    .string({ required_error: he.inventory.validation.nameRequired })
    .trim()
    .min(2, he.inventory.validation.nameMin)
    .max(60, he.inventory.validation.nameMax),
  category: z.enum(
    INVENTORY_CATEGORIES as [InventoryCategory, ...InventoryCategory[]],
    {
      required_error: he.inventory.validation.categoryRequired,
      invalid_type_error: he.inventory.validation.categoryRequired,
    },
  ),
  unit_type: z.enum(INVENTORY_UNITS as [InventoryUnit, ...InventoryUnit[]], {
    required_error: he.inventory.validation.unitRequired,
    invalid_type_error: he.inventory.validation.unitRequired,
  }),
  bulk_cost_ils: z
    .number({
      invalid_type_error: he.inventory.validation.bulkCostPositive,
    })
    .positive(he.inventory.validation.bulkCostPositive)
    .max(99999),
  bulk_quantity: z
    .number({
      invalid_type_error: he.inventory.validation.bulkQuantityPositive,
    })
    .positive(he.inventory.validation.bulkQuantityPositive)
    .max(99999),
  current_stock_units: z
    .number({
      invalid_type_error: he.inventory.validation.currentStockNonNegative,
    })
    .min(0, he.inventory.validation.currentStockNonNegative)
    .max(999999),
  low_stock_threshold: z
    .number({
      invalid_type_error: he.inventory.validation.thresholdNonNegative,
    })
    .min(0, he.inventory.validation.thresholdNonNegative)
    .max(999999),
  expiry_date: z
    .string()
    .nullable()
    .transform((v) => (v && v.length > 0 ? v : null)),
  notes_he: z
    .string()
    .max(500, he.inventory.validation.notesMax)
    .nullable()
    .transform((v) => (v && v.trim().length > 0 ? v : null)),
});

export type InventoryFormValues = z.infer<typeof inventoryFormSchema>;

export const INVENTORY_FORM_DEFAULTS: InventoryFormValues = {
  name_he: "",
  category: "brows",
  unit_type: "ml",
  bulk_cost_ils: 0,
  bulk_quantity: 0,
  current_stock_units: 0,
  low_stock_threshold: 0,
  expiry_date: null,
  notes_he: null,
};
