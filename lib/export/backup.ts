/**
 * Full local backup/restore for the Hadar Beauty database.
 * The backup is a single JSON file containing all 5 tables plus a version
 * field so the restore path can detect future format changes.
 */

import { getDB } from "@/lib/db/schema";
import type {
  InventoryItem,
  Service,
  ServiceMaterial,
  Settings,
  Transaction,
} from "@/lib/db/schema";
import { triggerDownload } from "./csv";

const BACKUP_VERSION = 1;
const APP_NAME = "hadar-beauty";

export interface BackupFile {
  app: string;
  version: number;
  exported_at: string; // ISO timestamp
  data: {
    services: Service[];
    inventory_items: InventoryItem[];
    service_materials: ServiceMaterial[];
    transactions: Transaction[];
    settings: Settings[];
  };
}

export async function buildBackup(): Promise<BackupFile> {
  const db = getDB();
  const [services, inventory_items, service_materials, transactions, settings] =
    await Promise.all([
      db.services.toArray(),
      db.inventory_items.toArray(),
      db.service_materials.toArray(),
      db.transactions.toArray(),
      db.settings.toArray(),
    ]);

  return {
    app: APP_NAME,
    version: BACKUP_VERSION,
    exported_at: new Date().toISOString(),
    data: {
      services,
      inventory_items,
      service_materials,
      transactions,
      settings,
    },
  };
}

export async function downloadBackup(): Promise<string> {
  const backup = await buildBackup();
  const filename = `hadar-beauty-backup-${formatDateForFilename(new Date())}.json`;
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  triggerDownload(blob, filename);
  return filename;
}

export async function readBackupFile(file: File): Promise<BackupFile> {
  const text = await file.text();
  const parsed = JSON.parse(text);
  if (!isBackupShape(parsed)) {
    throw new Error("invalid_backup_shape");
  }
  return parsed;
}

function isBackupShape(value: unknown): value is BackupFile {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  if (v.app !== APP_NAME) return false;
  if (typeof v.version !== "number") return false;
  if (!v.data || typeof v.data !== "object") return false;
  const d = v.data as Record<string, unknown>;
  return (
    Array.isArray(d.services) &&
    Array.isArray(d.inventory_items) &&
    Array.isArray(d.service_materials) &&
    Array.isArray(d.transactions) &&
    Array.isArray(d.settings)
  );
}

export async function restoreFromBackup(backup: BackupFile): Promise<void> {
  const db = getDB();
  await db.transaction(
    "rw",
    [
      db.services,
      db.inventory_items,
      db.service_materials,
      db.transactions,
      db.settings,
    ],
    async () => {
      // Clear all tables, then bulk insert from backup
      await Promise.all([
        db.services.clear(),
        db.inventory_items.clear(),
        db.service_materials.clear(),
        db.transactions.clear(),
        db.settings.clear(),
      ]);

      await Promise.all([
        db.services.bulkAdd(backup.data.services),
        db.inventory_items.bulkAdd(backup.data.inventory_items),
        db.service_materials.bulkAdd(backup.data.service_materials),
        db.transactions.bulkAdd(backup.data.transactions),
        db.settings.bulkAdd(backup.data.settings),
      ]);
    },
  );
}

function formatDateForFilename(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
