/**
 * Builds a CSV file for the accountant. We prepend a UTF-8 BOM (﻿) so
 * Excel opens Hebrew correctly without forcing the user to set encoding.
 *
 * The standard CSV escaping rules apply:
 *   - quote any value containing a comma, double-quote, or newline
 *   - escape internal double-quotes by doubling them
 */

import type {
  Service,
  ServiceCategory,
  Transaction,
} from "@/lib/db/schema";
import { he } from "@/lib/i18n/he";

const BOM = "﻿";

export interface CsvBuildContext {
  servicesById: Map<string, Service>;
  categoryLabel: (c: ServiceCategory) => string;
}

export function buildTransactionsCsv(
  transactions: Transaction[],
  ctx: CsvBuildContext,
): string {
  const headers = [
    he.analytics.csv.headers.date,
    he.analytics.csv.headers.type,
    he.analytics.csv.headers.description,
    he.analytics.csv.headers.gross,
    he.analytics.csv.headers.tax,
    he.analytics.csv.headers.cogs,
    he.analytics.csv.headers.net,
    he.analytics.csv.headers.paymentMethod,
    he.analytics.csv.headers.notes,
  ];

  const rows = transactions
    .slice()
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
    .map((t) => {
      const isIncome = t.type === "income";
      const description = isIncome
        ? t.service_id
          ? ctx.categoryLabel(
              ctx.servicesById.get(t.service_id)?.category ??
                ("facial" as ServiceCategory),
            )
          : "טיפול"
        : t.expense_category ?? "הוצאה";
      const gross = round2(t.amount_gross);
      const tax = isIncome ? round2(t.amount_gross * t.tax_rate) : 0;
      const cogs = isIncome ? round2(t.cogs_at_transaction) : 0;
      const net = isIncome ? round2(t.net_profit) : -round2(t.amount_gross);

      return [
        t.date,
        isIncome
          ? he.analytics.csv.types.income
          : he.analytics.csv.types.expense,
        description,
        gross.toFixed(2),
        tax.toFixed(2),
        cogs.toFixed(2),
        net.toFixed(2),
        he.paymentMethods[t.payment_method],
        t.notes_he ?? "",
      ];
    });

  const lines = [headers, ...rows].map(encodeRow);
  return BOM + lines.join("\r\n") + "\r\n";
}

function encodeRow(row: Array<string | number>): string {
  return row.map((cell) => encodeCell(String(cell))).join(",");
}

function encodeCell(value: string): string {
  if (value.includes(",") || value.includes("\n") || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  triggerDownload(blob, filename);
}

export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
