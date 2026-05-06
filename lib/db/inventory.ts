import {
  getDB,
  type InventoryCategory,
  type InventoryItem,
  type InventoryUnit,
} from "./schema";
import { generateId } from "@/lib/utils";
import { computeUnitCost } from "@/lib/calculations/unit-cost";

export interface InventoryInput {
  name_he: string;
  category: InventoryCategory;
  bulk_cost_ils: number;
  bulk_quantity: number;
  unit_type: InventoryUnit;
  current_stock_units: number;
  low_stock_threshold: number;
  expiry_date: string | null;
  notes_he: string | null;
}

export async function listInventoryItems(): Promise<InventoryItem[]> {
  const db = getDB();
  return db.inventory_items.orderBy("created_at").reverse().toArray();
}

export async function getInventoryItem(
  id: string,
): Promise<InventoryItem | undefined> {
  const db = getDB();
  return db.inventory_items.get(id);
}

export async function createInventoryItem(
  input: InventoryInput,
): Promise<InventoryItem> {
  const db = getDB();
  const now = Date.now();
  const { costPerUnit } = computeUnitCost({
    bulkCost: input.bulk_cost_ils,
    bulkQuantity: input.bulk_quantity,
    currentStock: input.current_stock_units,
  });
  const item: InventoryItem = {
    id: generateId(),
    ...input,
    cost_per_unit: costPerUnit,
    created_at: now,
    updated_at: now,
  };
  await db.inventory_items.add(item);
  return item;
}

export async function updateInventoryItem(
  id: string,
  patch: Partial<InventoryInput>,
): Promise<void> {
  const db = getDB();
  const existing = await db.inventory_items.get(id);
  if (!existing) return;

  const merged: InventoryItem = { ...existing, ...patch };
  const { costPerUnit } = computeUnitCost({
    bulkCost: merged.bulk_cost_ils,
    bulkQuantity: merged.bulk_quantity,
    currentStock: merged.current_stock_units,
  });
  await db.inventory_items.update(id, {
    ...patch,
    cost_per_unit: costPerUnit,
    updated_at: Date.now(),
  });
}

export async function deleteInventoryItem(id: string): Promise<void> {
  const db = getDB();
  // Cascade: also remove any service-material linkage rows for this item
  await db.transaction(
    "rw",
    db.inventory_items,
    db.service_materials,
    async () => {
      await db.service_materials
        .where("inventory_item_id")
        .equals(id)
        .delete();
      await db.inventory_items.delete(id);
    },
  );
}

export async function isInventoryNameUnique(
  name_he: string,
  excludeId?: string,
): Promise<boolean> {
  const db = getDB();
  const normalized = name_he.trim().toLowerCase();
  const matches = await db.inventory_items
    .filter((i) => i.name_he.trim().toLowerCase() === normalized)
    .toArray();
  if (matches.length === 0) return true;
  if (excludeId && matches.every((i) => i.id === excludeId)) return true;
  return false;
}
