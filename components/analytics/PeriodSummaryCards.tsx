"use client";

import { TrendingUp, Wallet, TrendingDown, FileSpreadsheet } from "lucide-react";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { formatILS } from "@/lib/utils";
import { he } from "@/lib/i18n/he";
import type { PeriodTotals } from "@/lib/calculations/aggregations";

interface PeriodSummaryCardsProps {
  totals: PeriodTotals;
}

export function PeriodSummaryCards({ totals }: PeriodSummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <DashboardCard
        label={he.analytics.summary.income}
        value={formatILS(totals.gross_income)}
        caption={`${totals.income_count} עסקאות`}
        icon={<TrendingUp className="h-3.5 w-3.5" />}
        tone="success"
      />
      <DashboardCard
        label={he.analytics.summary.net}
        value={formatILS(totals.net_profit)}
        caption={
          totals.gross_income > 0
            ? `${Math.round((totals.net_profit / totals.gross_income) * 100)}% שולי רווח`
            : "אין הכנסות"
        }
        icon={<Wallet className="h-3.5 w-3.5" />}
        tone="primary"
      />
      <DashboardCard
        label={he.analytics.summary.expenses}
        value={
          totals.expenses > 0 ? `-${formatILS(totals.expenses)}` : formatILS(0)
        }
        caption={`${totals.expense_count} הוצאות`}
        icon={<TrendingDown className="h-3.5 w-3.5" />}
        tone={totals.expenses > 0 ? "destructive" : "neutral"}
      />
      <DashboardCard
        label={he.analytics.summary.vat}
        value={formatILS(totals.tax_collected)}
        caption="לדיווח לרשויות"
        icon={<FileSpreadsheet className="h-3.5 w-3.5" />}
        tone="warning"
      />
    </div>
  );
}
