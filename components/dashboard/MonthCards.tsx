"use client";

import { TrendingUp, Wallet, FileSpreadsheet } from "lucide-react";
import { DashboardCard } from "./DashboardCard";
import { formatILS, formatPercent } from "@/lib/utils";
import { he } from "@/lib/i18n/he";
import type { PeriodTotals } from "@/lib/calculations/aggregations";
import { percentChange } from "@/lib/calculations/period";

interface MonthCardsProps {
  current: PeriodTotals;
  prior: PeriodTotals;
}

export function MonthCards({ current, prior }: MonthCardsProps) {
  const netDelta = percentChange(current.net_profit, prior.net_profit);

  let deltaCaption: string;
  let deltaTone: "success" | "destructive" | "neutral" = "neutral";
  if (netDelta === null) {
    deltaCaption = he.dashboard.month.vsLastMonth.noPrior;
  } else if (netDelta > 0) {
    deltaCaption = he.dashboard.month.vsLastMonth.up(
      formatPercent(netDelta, 0),
    );
    deltaTone = "success";
  } else if (netDelta < 0) {
    deltaCaption = he.dashboard.month.vsLastMonth.down(
      formatPercent(Math.abs(netDelta), 0),
    );
    deltaTone = "destructive";
  } else {
    deltaCaption = he.dashboard.month.vsLastMonth.same;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <DashboardCard
        label={he.dashboard.month.income}
        value={formatILS(current.gross_income)}
        caption={he.dashboard.month.txCount(current.income_count)}
        icon={<TrendingUp className="h-3.5 w-3.5" />}
        tone="success"
      />
      <DashboardCard
        label={he.dashboard.month.net}
        value={formatILS(current.net_profit)}
        caption={
          <span
            className={
              deltaTone === "success"
                ? "text-success"
                : deltaTone === "destructive"
                  ? "text-destructive"
                  : "text-muted-foreground"
            }
          >
            {deltaCaption}
          </span>
        }
        icon={<Wallet className="h-3.5 w-3.5" />}
        tone="primary"
      />
      <DashboardCard
        label={he.dashboard.month.vat}
        value={formatILS(current.tax_collected)}
        caption={he.dashboard.month.vatHint}
        icon={<FileSpreadsheet className="h-3.5 w-3.5" />}
        tone="warning"
      />
    </div>
  );
}
