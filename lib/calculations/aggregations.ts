/**
 * Aggregation helpers used by the dashboard and analytics screens.
 * All functions are pure - they take rows in and return numbers/maps out.
 */

import type {
  PaymentMethod,
  Service,
  Transaction,
  ServiceCategory,
} from "@/lib/db/schema";
import { isInRange, type DateRange } from "./period";

export interface PeriodTotals {
  range: DateRange;
  gross_income: number;
  tax_collected: number;
  cogs_total: number;
  net_profit: number;
  expenses: number;
  bottom_line: number;
  income_count: number;
  expense_count: number;
}

export function summarizePeriod(
  transactions: Transaction[],
  range: DateRange,
): PeriodTotals {
  let gross_income = 0;
  let tax_collected = 0;
  let cogs_total = 0;
  let net_profit = 0;
  let expenses = 0;
  let income_count = 0;
  let expense_count = 0;

  for (const t of transactions) {
    if (!isInRange(t.date, range)) continue;
    if (t.type === "income") {
      gross_income += t.amount_gross;
      tax_collected += t.amount_gross * t.tax_rate;
      cogs_total += t.cogs_at_transaction;
      net_profit += t.net_profit;
      income_count += 1;
    } else {
      expenses += t.amount_gross;
      expense_count += 1;
    }
  }

  return {
    range,
    gross_income,
    tax_collected,
    cogs_total,
    net_profit,
    expenses,
    bottom_line: net_profit - expenses,
    income_count,
    expense_count,
  };
}

export interface ServicePerformance {
  service_id: string;
  category: ServiceCategory;
  display_name_he: string;
  count: number;
  gross: number;
  net_profit: number;
  avg_net: number;
}

export function computeServicePerformance(
  transactions: Transaction[],
  services: Service[],
  range: DateRange,
  /** Map category -> Hebrew label so this util has no i18n dependency. */
  labelForCategory: (c: ServiceCategory) => string,
): ServicePerformance[] {
  const byId = new Map<string, Service>();
  for (const s of services) byId.set(s.id, s);

  const perService = new Map<
    string,
    { count: number; gross: number; net: number }
  >();

  for (const t of transactions) {
    if (t.type !== "income") continue;
    if (!t.service_id) continue;
    if (!isInRange(t.date, range)) continue;
    const cur = perService.get(t.service_id) ?? { count: 0, gross: 0, net: 0 };
    cur.count += 1;
    cur.gross += t.amount_gross;
    cur.net += t.net_profit;
    perService.set(t.service_id, cur);
  }

  const rows: ServicePerformance[] = [];
  for (const [serviceId, agg] of perService) {
    const service = byId.get(serviceId);
    if (!service) continue;
    rows.push({
      service_id: serviceId,
      category: service.category,
      // Use the service's own name (e.g. "עיצוב גבות + צבע") when available,
      // falling back to the category label for safety.
      display_name_he: service.name_he || labelForCategory(service.category),
      count: agg.count,
      gross: agg.gross,
      net_profit: agg.net,
      avg_net: agg.count > 0 ? agg.net / agg.count : 0,
    });
  }

  rows.sort((a, b) => b.net_profit - a.net_profit);
  return rows;
}

export function pickTopService(
  rows: ServicePerformance[],
): ServicePerformance | null {
  return rows.length > 0 ? rows[0] : null;
}

export interface ExpenseBreakdownEntry {
  category: string;
  total: number;
  count: number;
  share: number; // 0..1 of period expenses
}

export function computeExpenseBreakdown(
  transactions: Transaction[],
  range: DateRange,
): ExpenseBreakdownEntry[] {
  const buckets = new Map<string, { total: number; count: number }>();
  let grandTotal = 0;

  for (const t of transactions) {
    if (t.type !== "expense") continue;
    if (!isInRange(t.date, range)) continue;
    const key = t.expense_category ?? "אחר";
    const cur = buckets.get(key) ?? { total: 0, count: 0 };
    cur.total += t.amount_gross;
    cur.count += 1;
    buckets.set(key, cur);
    grandTotal += t.amount_gross;
  }

  const entries: ExpenseBreakdownEntry[] = [];
  for (const [category, agg] of buckets) {
    entries.push({
      category,
      total: agg.total,
      count: agg.count,
      share: grandTotal > 0 ? agg.total / grandTotal : 0,
    });
  }
  entries.sort((a, b) => b.total - a.total);
  return entries;
}

export interface DailyAggregate {
  date: string;
  gross_income: number;
  net_profit: number;
  expenses: number;
}

/**
 * Returns one row per day in the range (zero-filled), so charts plot a
 * continuous line even when some days had no activity.
 */
export function computeDailyTimeseries(
  transactions: Transaction[],
  range: DateRange,
): DailyAggregate[] {
  const buckets = new Map<string, DailyAggregate>();
  // Pre-fill all days
  const start = new Date(range.start);
  for (let i = 0; i < range.days; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0",
    )}-${String(d.getDate()).padStart(2, "0")}`;
    buckets.set(iso, {
      date: iso,
      gross_income: 0,
      net_profit: 0,
      expenses: 0,
    });
  }

  for (const t of transactions) {
    if (!isInRange(t.date, range)) continue;
    const bucket = buckets.get(t.date);
    if (!bucket) continue;
    if (t.type === "income") {
      bucket.gross_income += t.amount_gross;
      bucket.net_profit += t.net_profit;
    } else {
      bucket.expenses += t.amount_gross;
    }
  }

  return Array.from(buckets.values()).sort((a, b) =>
    a.date < b.date ? -1 : 1,
  );
}

// ─── Insight helpers ────────────────────────────────────────────────────────

export interface BestDayResult {
  date: string;        // ISO date, e.g. "2024-05-15"
  net_profit: number;  // combined income net minus expenses for that day
}

/**
 * Returns the single calendar day in `range` with the highest
 * (income net profit − expenses). Returns null if no income exists.
 */
export function pickBestDay(
  transactions: Transaction[],
  range: DateRange,
): BestDayResult | null {
  const byDay = new Map<string, number>();

  for (const t of transactions) {
    if (!isInRange(t.date, range)) continue;
    const cur = byDay.get(t.date) ?? 0;
    if (t.type === "income") {
      byDay.set(t.date, cur + t.net_profit);
    } else {
      byDay.set(t.date, cur - t.amount_gross);
    }
  }

  if (byDay.size === 0) return null;

  let bestDate = "";
  let bestNet = -Infinity;
  for (const [date, net] of byDay) {
    if (net > bestNet) {
      bestNet = net;
      bestDate = date;
    }
  }

  return bestNet > 0 ? { date: bestDate, net_profit: bestNet } : null;
}

export interface TopPaymentMethodResult {
  method: PaymentMethod;
  count: number;
  share: number; // 0..1 of all income transactions in range
}

/**
 * Returns the payment method used most often for income transactions
 * in `range`. Returns null if there are no income transactions.
 */
export function pickTopPaymentMethod(
  transactions: Transaction[],
  range: DateRange,
): TopPaymentMethodResult | null {
  const counts = new Map<PaymentMethod, number>();
  let total = 0;

  for (const t of transactions) {
    if (t.type !== "income") continue;
    if (!isInRange(t.date, range)) continue;
    counts.set(t.payment_method, (counts.get(t.payment_method) ?? 0) + 1);
    total += 1;
  }

  if (total === 0) return null;

  let topMethod: PaymentMethod = "cash";
  let topCount = 0;
  for (const [method, count] of counts) {
    if (count > topCount) {
      topCount = count;
      topMethod = method;
    }
  }

  return { method: topMethod, count: topCount, share: topCount / total };
}

// ─── Yearly monthly timeseries ───────────────────────────────────────────────

const MONTHS_SHORT_HE = [
  "ינו׳", "פבר׳", "מרץ", "אפר׳", "מאי", "יוני",
  "יולי", "אוג׳", "ספט׳", "אוק׳", "נוב׳", "דצמ׳",
];

export interface MonthlyDataPoint {
  month: number;      // 1–12
  label: string;      // "ינו׳"
  net_profit: number;
  gross_income: number;
  expenses: number;
}

/**
 * Returns 12 monthly buckets for the given calendar year.
 * net_profit already incorporates expenses (negative contribution).
 */
export function computeYearlyTimeseries(
  transactions: Transaction[],
  year: number,
): MonthlyDataPoint[] {
  const data: MonthlyDataPoint[] = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    label: MONTHS_SHORT_HE[i],
    net_profit: 0,
    gross_income: 0,
    expenses: 0,
  }));

  for (const t of transactions) {
    const parts = t.date.split("-");
    const ty = Number(parts[0]);
    const tm = Number(parts[1]);
    if (ty !== year || tm < 1 || tm > 12) continue;
    const idx = tm - 1;
    if (t.type === "income") {
      data[idx].gross_income += t.amount_gross;
    } else {
      data[idx].expenses += t.amount_gross;
    }
    // t.net_profit is already negative for expenses — just sum
    data[idx].net_profit += t.net_profit;
  }

  return data;
}
