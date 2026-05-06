import {
  getDB,
  type PaymentMethod,
  type Transaction,
  type TransactionType,
} from "./schema";
import { generateId } from "@/lib/utils";
import { ISRAELI_VAT_RATE } from "@/lib/calculations/margin";
import { computeServiceCogs } from "@/lib/calculations/cogs";

export interface TransactionInput {
  date: string; // ISO date "YYYY-MM-DD"
  type: TransactionType;
  service_id: string | null;
  amount_gross: number;
  payment_method: PaymentMethod;
  expense_category: string | null;
  notes_he: string | null;
}

export async function listTransactions(): Promise<Transaction[]> {
  const db = getDB();
  return db.transactions.orderBy("date").reverse().toArray();
}

export async function listTransactionsByDateRange(
  startIso: string,
  endIso: string,
): Promise<Transaction[]> {
  const db = getDB();
  return db.transactions
    .where("date")
    .between(startIso, endIso, true, true)
    .toArray();
}

export async function getTransaction(
  id: string,
): Promise<Transaction | undefined> {
  const db = getDB();
  return db.transactions.get(id);
}

export async function createTransaction(
  input: TransactionInput,
): Promise<Transaction> {
  const db = getDB();
  const cogs =
    input.type === "income" && input.service_id
      ? (await computeServiceCogs(input.service_id)).total
      : 0;

  const tax_rate = ISRAELI_VAT_RATE;
  const tax = input.type === "income" ? input.amount_gross * tax_rate : 0;
  const net_profit =
    input.type === "income"
      ? input.amount_gross - tax - cogs
      : -input.amount_gross;

  const transaction: Transaction = {
    id: generateId(),
    date: input.date,
    type: input.type,
    service_id: input.service_id,
    amount_gross: input.amount_gross,
    tax_rate,
    cogs_at_transaction: cogs,
    net_profit,
    payment_method: input.payment_method,
    expense_category: input.expense_category,
    notes_he: input.notes_he,
    created_at: Date.now(),
  };
  await db.transactions.add(transaction);
  return transaction;
}

export async function updateTransaction(
  id: string,
  input: TransactionInput,
): Promise<void> {
  const db = getDB();
  const cogs =
    input.type === "income" && input.service_id
      ? (await computeServiceCogs(input.service_id)).total
      : 0;
  const tax_rate = ISRAELI_VAT_RATE;
  const tax = input.type === "income" ? input.amount_gross * tax_rate : 0;
  const net_profit =
    input.type === "income"
      ? input.amount_gross - tax - cogs
      : -input.amount_gross;

  await db.transactions.update(id, {
    date: input.date,
    type: input.type,
    service_id: input.service_id,
    amount_gross: input.amount_gross,
    tax_rate,
    cogs_at_transaction: cogs,
    net_profit,
    payment_method: input.payment_method,
    expense_category: input.expense_category,
    notes_he: input.notes_he,
  });
}

export async function deleteTransaction(id: string): Promise<void> {
  const db = getDB();
  await db.transactions.delete(id);
}

export interface DailyTotals {
  date: string;
  gross_income: number;
  tax_total: number;
  cogs_total: number;
  net_profit_total: number;
  expenses_total: number;
  bottom_line: number;
  income_count: number;
  expense_count: number;
}

export function summarizeDay(
  transactions: Transaction[],
  isoDate: string,
): DailyTotals {
  const day = transactions.filter((t) => t.date === isoDate);
  let gross_income = 0;
  let tax_total = 0;
  let cogs_total = 0;
  let net_profit_total = 0;
  let expenses_total = 0;
  let income_count = 0;
  let expense_count = 0;

  for (const t of day) {
    if (t.type === "income") {
      gross_income += t.amount_gross;
      tax_total += t.amount_gross * t.tax_rate;
      cogs_total += t.cogs_at_transaction;
      net_profit_total += t.net_profit;
      income_count += 1;
    } else {
      expenses_total += t.amount_gross;
      expense_count += 1;
    }
  }

  return {
    date: isoDate,
    gross_income,
    tax_total,
    cogs_total,
    net_profit_total,
    expenses_total,
    bottom_line: net_profit_total - expenses_total,
    income_count,
    expense_count,
  };
}

export function todayIso(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
