import { getDB, type ServiceMaterial } from "./schema";
import { generateId } from "@/lib/utils";

export interface ServiceMaterialInput {
  service_id: string;
  inventory_item_id: string;
  units_consumed_per_service: number;
}

export async function listLinksForInventoryItem(
  inventoryItemId: string,
): Promise<ServiceMaterial[]> {
  const db = getDB();
  return db.service_materials
    .where("inventory_item_id")
    .equals(inventoryItemId)
    .toArray();
}

export async function listLinksForService(
  serviceId: string,
): Promise<ServiceMaterial[]> {
  const db = getDB();
  return db.service_materials.where("service_id").equals(serviceId).toArray();
}

export async function createServiceMaterial(
  input: ServiceMaterialInput,
): Promise<ServiceMaterial> {
  const db = getDB();
  const link: ServiceMaterial = { id: generateId(), ...input };
  await db.service_materials.add(link);
  return link;
}

export async function updateServiceMaterial(
  id: string,
  patch: Partial<ServiceMaterialInput>,
): Promise<void> {
  const db = getDB();
  await db.service_materials.update(id, patch);
}

export async function deleteServiceMaterial(id: string): Promise<void> {
  const db = getDB();
  await db.service_materials.delete(id);
}

export async function findExistingLink(
  serviceId: string,
  inventoryItemId: string,
): Promise<ServiceMaterial | undefined> {
  const db = getDB();
  return db.service_materials
    .where("[service_id+inventory_item_id]")
    .equals([serviceId, inventoryItemId])
    .first();
}

export async function upsertServiceMaterial(
  input: ServiceMaterialInput,
): Promise<ServiceMaterial> {
  const existing = await findExistingLink(
    input.service_id,
    input.inventory_item_id,
  );
  if (existing) {
    await updateServiceMaterial(existing.id, {
      units_consumed_per_service: input.units_consumed_per_service,
    });
    return {
      ...existing,
      units_consumed_per_service: input.units_consumed_per_service,
    };
  }
  return createServiceMaterial(input);
}
