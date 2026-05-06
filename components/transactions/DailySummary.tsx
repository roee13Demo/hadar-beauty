"use client";

import {
  TrendingUp,
  Wallet,
  TrendingDown,
  Sigma,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatILS } from "@/lib/utils";
import { he } from "@/lib/i18n/he";
import type { DailyTotals } from "@/lib/db/transactions";

interface DailySummaryProps {
  totals: DailyTotals;
}

export function DailySummary({ totals }: DailySummaryProps) {
  const cards = [
    {
      label: he.transactions.summary.todayIncome,
      value: formatILS(totals.gross_income),
      caption: he.transactions.summary.countIncome(totals.income_count),
      icon: TrendingUp,
      tone: "success" as const,
    },
    {
      label: he.transactions.summary.todayNet,
      value: formatILS(totals.net_profit_total),
      caption:
        totals.gross_income > 0
          ? `מתוך ${formatILS(totals.gross_income)}`
          : he.transactions.summary.noActivityToday,
      icon: Wallet,
      tone: "primary" as const,
    },
    {
      label: he.transactions.summary.todayExpenses,
      value: `-${formatILS(totals.expenses_total)}`,
      caption: he.transactions.summary.countExpense(totals.expense_count),
      icon: TrendingDown,
      tone: "destructive" as const,
    },
    {
      label: he.transactions.summary.todayBottomLine,
      value: `${totals.bottom_line >= 0 ? "+" : ""}${formatILS(totals.bottom_line)}`,
      caption: "נטו - הוצאות",
      icon: Sigma,
      tone:
        totals.bottom_line >= 0
          ? ("success" as const)
          : ("destructive" as const),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const valueClass =
          card.tone === "success"
            ? "text-success"
            : card.tone === "destructive"
              ? "text-destructive"
              : "text-foreground";
        const iconClass =
          card.tone === "success"
            ? "bg-success/15 text-success"
            : card.tone === "destructive"
              ? "bg-destructive/10 text-destructive"
              : "bg-primary/10 text-primary";
        return (
          <Card key={card.label} className="overflow-hidden">
            <CardContent className="flex flex-col gap-3 p-5 pt-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  {card.label}
                </span>
                <div
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-md",
                    iconClass,
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>
              </div>
              <div
                className={cn(
                  "num text-2xl font-semibold tabular-nums",
                  valueClass,
                )}
              >
                {card.value}
              </div>
              <div className="text-xs text-muted-foreground">
                {card.caption}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
