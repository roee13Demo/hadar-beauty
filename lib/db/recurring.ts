/**
 * Recurring expenses — CRUD plus the "post pending" workflow.
 *
 * Each recurring entry represents a fixed monthly expense (rent, insurance,
 * subscriptions, etc.). When the calendar reaches the entry's `day_of_month`
 * and that month hasn't been posted yet, the dashboard surfaces a banner so
 * the user can post all pending items in one click.
 *
 * Posting creates a real `Transaction` row and stamps `last_posted_month`
 * on the recurring entry to prevent duplicates.
 */

import {
  getDB,
  type PaymentMethod,
  type RecurringExpense,
} from "./schema";
import { createTransaction } from "./transactions";
import { generateId } from "@/lib/utils";

export interface RecurringExpenseInput {
  name_he: string;
  amount_ils: number;
  expense_category: string;
  payment_method: PaymentMethod;
  day_of_month: number;
  is_active: boolean;
  notes_he: string | null;
}

export async function listRecurringExpenses(): Promise<RecurringExpense[]> {
  const db = getDB();
  return db.recurring_expenses.orderBy("created_at").reverse().toArray();
}

export async function getRecurringExpense(
  id: string,
): Promise<RecurringExpense | undefined> {
  const db = getDB();
  return db.recurring_expenses.get(id);
}

export async function createRecurringExpense(
  input: RecurringExpenseInput,
): Promise<RecurringExpense> {
  const db = getDB();
  const now = Date.now();
  const row: RecurringExpense = {
    id: generateId(),
    ...input,
    last_posted_month: null,
    created_at: now,
    updated_at: now,
  };
  await db.recurring_expenses.add(row);
  return row;
}

export async function updateRecurringExpense(
  id: string,
  patch: Partial<RecurringExpenseInput>,
): Promise<void> {
  const db = getDB();
  await db.recurring_expenses.update(id, {
    ...patch,
    updated_at: Date.now(),
  });
}

export async function deleteRecurringExpense(id: string): Promise<void> {
  const db = getDB();
  await db.recurring_expenses.delete(id);
}

// ─── Pending / posting logic ────────────────────────────────────────────────

/** "YYYY-MM" key for a Date, in local time. */
export function monthKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

/** A recurring entry is "due this month" when it's active, the day-of-month
 *  has arrived, and we haven't yet posted for the current month. */
export function isPending(entry: RecurringExpense, today: Date): boolean {
  if (!entry.is_active) return false;
  const currentMonth = monthKey(today);
  if (entry.last_posted_month === currentMonth) return false;
  // Allow posting if today >= day_of_month, OR if today is the last day of
  // a short month (Feb 28/29) and day_of_month was 29-31 — clamp upward so
  // it still posts in February.
  const lastDayOfMonth = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0,
  ).getDate();
  const targetDay = Math.min(entry.day_of_month, lastDayOfMonth);
  return today.getDate() >= targetDay;
}

/** Returns all recurring entries that are due to be posted but haven't
 *  been posted yet for the current month. */
export async function listPendingRecurringExpenses(
  today: Date = new Date(),
): Promise<RecurringExpense[]> {
  const all = await listRecurringExpenses();
  return all.filter((r) => isPending(r, today));
}

/**
 * Posts a single recurring entry as a real Transaction for the current
 * calendar month, then stamps `last_posted_month`. Returns the created
 * transaction id.
 */
export async function postRecurringExpense(
  entry: RecurringExpense,
  today: Date = new Date(),
): Promise<string> {
  const lastDayOfMonth = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0,
  ).getDate();
  const day = Math.min(entry.day_of_month, lastDayOfMonth);
  const dateIso = `${today.getFullYear()}-${String(
    today.getMonth() + 1,
  ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const tx = await createTransaction({
    date: dateIso,
    type: "expense",
    service_id: null,
    amount_gross: entry.amount_ils,
    payment_method: entry.payment_method,
    expense_category: entry.expense_category,
    notes_he: entry.notes_he ?? `הוצאה קבועה: ${entry.name_he}`,
  });

  await updateRecurringExpense(entry.id, {});
  // updateRecurringExpense doesn't accept last_posted_month directly — write
  // it via the table to keep types tight.
  const db = getDB();
  await db.recurring_expenses.update(entry.id, {
    last_posted_month: monthKey(today),
    updated_at: Date.now(),
  });

  return tx.id;
}

/** Posts every pending recurring expense in one go. Returns the count. */
export async function postAllPendingRecurringExpenses(
  today: Date = new Date(),
): Promise<number> {
  const pending = await listPendingRecurringExpenses(today);
  for (const entry of pending) {
    await postRecurringExpense(entry, today);
  }
  return pending.length;
}
