"use client";

import { TrendingUp, Wallet, TrendingDown } from "lucide-react";
import { DashboardCard } from "./DashboardCard";
import { formatILS, formatPercent } from "@/lib/utils";
import { he } from "@/lib/i18n/he";
import type { PeriodTotals } from "@/lib/calculations/aggregations";

interface TodayCardsProps {
  totals: PeriodTotals;
}

export function TodayCards({ totals }: TodayCardsProps) {
  const margin =
    totals.gross_income > 0 ? totals.net_profit / totals.gross_income : 0;
  const marginCaption =
    totals.gross_income > 0
      ? he.dashboard.today.marginLabel(formatPercent(margin, 0))
      : he.dashboard.today.noActivity;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <DashboardCard
        label={he.dashboard.today.income}
        value={formatILS(totals.gross_income)}
        caption={he.dashboard.today.txCount(totals.income_count)}
        icon={<TrendingUp className="h-3.5 w-3.5" />}
        tone="success"
      />
      <DashboardCard
        label={he.dashboard.today.net}
        value={formatILS(totals.net_profit)}
        caption={marginCaption}
        icon={<Wallet className="h-3.5 w-3.5" />}
        tone={totals.net_profit > 0 ? "primary" : "neutral"}
      />
      <DashboardCard
        label={he.dashboard.today.expenses}
        value={
          totals.expenses > 0 ? `-${formatILS(totals.expenses)}` : formatILS(0)
        }
        caption={he.dashboard.today.expenseCount(totals.expense_count)}
        icon={<TrendingDown className="h-3.5 w-3.5" />}
        tone={totals.expenses > 0 ? "destructive" : "neutral"}
      />
    </div>
  );
}
