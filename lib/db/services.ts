import {
  COLOR_ADDON_NAME,
  type Service,
  type ServiceAddOn,
  type ServiceCategory,
} from "./schema";
import { getDB } from "./schema";
import { generateId } from "@/lib/utils";

export interface ServiceInput {
  name_he: string;
  category: ServiceCategory;
  price_ils: number;
  estimated_material_cost: number;
  duration_minutes: number;
  is_active: boolean;
  add_ons: ServiceAddOn[];
}

export async function listServices(): Promise<Service[]> {
  const db = getDB();
  const all = await db.services.orderBy("created_at").reverse().toArray();
  return all.map(normalizeService);
}

export async function getService(id: string): Promise<Service | undefined> {
  const db = getDB();
  const found = await db.services.get(id);
  return found ? normalizeService(found) : undefined;
}

export async function createService(input: ServiceInput): Promise<Service> {
  const db = getDB();
  const now = Date.now();
  const service: Service = {
    id: generateId(),
    ...input,
    created_at: now,
    updated_at: now,
  };
  await db.services.add(service);
  return service;
}

export async function updateService(
  id: string,
  patch: Partial<ServiceInput>,
): Promise<void> {
  const db = getDB();
  await db.services.update(id, { ...patch, updated_at: Date.now() });
}

export async function deleteService(id: string): Promise<void> {
  const db = getDB();
  await db.services.delete(id);
}

export async function isServiceNameUnique(
  name_he: string,
  excludeId?: string,
): Promise<boolean> {
  const db = getDB();
  const all = await db.services.toArray();
  const normalized = name_he.trim().toLowerCase();
  const matches = all.filter(
    (s) => s.name_he.trim().toLowerCase() === normalized,
  );
  if (matches.length === 0) return true;
  if (excludeId && matches.every((s) => s.id === excludeId)) return true;
  return false;
}

export function findColorAddon(service: Service): ServiceAddOn | undefined {
  return service.add_ons.find((a) => a.name_he === COLOR_ADDON_NAME);
}

function normalizeService(service: Service): Service {
  return {
    ...service,
    add_ons: Array.isArray(service.add_ons) ? service.add_ons : [],
  };
}
