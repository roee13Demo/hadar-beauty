import {
  DEFAULT_SETTINGS,
  DEFAULT_EXPENSE_CATEGORIES,
  getDB,
  type Settings,
} from "./schema";

/**
 * Pure read — never writes. Safe to call from useLiveQuery callbacks.
 * Returns stored row merged with defaults so all fields are always present.
 */
export async function readSettings(): Promise<Settings> {
  const db = getDB();
  const existing = await db.settings.get("singleton");
  if (!existing) return { ...DEFAULT_SETTINGS };
  return {
    ...DEFAULT_SETTINGS,
    ...existing,
  };
}

/**
 * Returns the singleton settings row, lazily creating / backfilling it with
 * defaults if needed. Contains writes — do NOT call from useLiveQuery.
 * Call once on mount via useEffect for initialization.
 */
export async function getSettings(): Promise<Settings> {
  const db = getDB();
  const existing = await db.settings.get("singleton");
  if (existing) {
    // Defensively backfill new fields on read (handles older rows from before
    // a migration ran on this device).
    let repaired = existing;
    let dirty = false;
    if (!Array.isArray(repaired.expense_categories)) {
      repaired = {
        ...repaired,
        expense_categories: [...DEFAULT_EXPENSE_CATEGORIES],
      };
      dirty = true;
    }
    if (typeof repaired.monthly_net_goal_ils !== "number") {
      repaired = { ...repaired, monthly_net_goal_ils: 0 };
      dirty = true;
    }
    if (dirty) await db.settings.put(repaired);
    return repaired;
  }
  await db.settings.put({ ...DEFAULT_SETTINGS });
  return { ...DEFAULT_SETTINGS };
}

/**
 * Pure read — safe for useLiveQuery. Returns expense categories with defaults.
 */
export async function readExpenseCategories(): Promise<string[]> {
  const settings = await readSettings();
  return settings.expense_categories ?? [...DEFAULT_EXPENSE_CATEGORIES];
}

export async function setMonthlyNetGoal(amount: number): Promise<void> {
  const db = getDB();
  // getSettings() ensures the row exists (creates it with defaults if missing)
  const current = await getSettings();
  const safe = Math.max(0, Math.round(amount));
  // Use put (not update) so the write succeeds even on a freshly seeded row
  await db.settings.put({ ...current, monthly_net_goal_ils: safe });
}

export async function listExpenseCategories(): Promise<string[]> {
  const settings = await getSettings();
  return settings.expense_categories;
}

export async function addExpenseCategory(name: string): Promise<string[]> {
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    throw new Error("empty category name");
  }
  const db = getDB();
  const settings = await getSettings();
  const exists = settings.expense_categories.some(
    (c) => c.trim().toLowerCase() === trimmed.toLowerCase(),
  );
  if (exists) return settings.expense_categories;

  const next = [...settings.expense_categories, trimmed];
  await db.settings.update("singleton", { expense_categories: next });
  return next;
}

export async function removeExpenseCategory(name: string): Promise<string[]> {
  const db = getDB();
  const settings = await getSettings();
  const next = settings.expense_categories.filter(
    (c) => c.trim().toLowerCase() !== name.trim().toLowerCase(),
  );
  await db.settings.update("singleton", { expense_categories: next });
  return next;
}
