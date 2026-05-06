"use client";

import { useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { he } from "@/lib/i18n/he";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { listTransactionsByDateRange, todayIso, summarizeDay } from "@/lib/db/transactions";
import { formatILS } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

/**
 * Slim top bar shown only on mobile (hidden on md+).
 * Includes app name, theme toggle, and a tappable "today" earnings pill.
 */
export function MobileHeader() {
  const today = useMemo(() => todayIso(), []);
  const todayTx = useLiveQuery(
    () => listTransactionsByDateRange(today, today),
    [today],
    [],
  );
  const [sheetOpen, setSheetOpen] = useState(false);

  const summary = useMemo(
    () => summarizeDay(todayTx ?? [], today),
    [todayTx, today],
  );

  const hasData = summary.income_count + summary.expense_count > 0;
  const net = summary.bottom_line;
  const isPositive = net > 0;
  const isNegative = net < 0;

  return (
    <>
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border/60 bg-card px-4 py-3 md:hidden">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Sparkles className="h-4 w-4" />
        </div>
        <span className="flex-1 text-base font-semibold tracking-tight">
          {he.app.name}
        </span>

        {/* Daily earnings pill */}
        <button
          onClick={() => setSheetOpen(true)}
          className={cn(
            "flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
            hasData && isPositive
              ? "border-success/40 bg-success/10 text-success"
              : hasData && isNegative
                ? "border-destructive/40 bg-destructive/10 text-destructive"
                : "border-border bg-muted/50 text-muted-foreground",
          )}
        >
          <span>{he.dailyWidget.label}</span>
          <span className="num tabular-nums">
            {hasData ? formatILS(net) : "—"}
          </span>
        </button>

        <ThemeToggle />
      </header>

      {/* Today breakdown sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl pb-safe">
          <SheetHeader className="pb-4 text-start">
            <SheetTitle>{he.dailyWidget.tooltipTitle}</SheetTitle>
          </SheetHeader>

          {!hasData ? (
            <p className="pb-6 text-sm text-muted-foreground">
              {he.dailyWidget.noData}
            </p>
          ) : (
            <div className="flex flex-col gap-3 pb-6">
              <Row
                label={he.dailyWidget.gross}
                value={formatILS(summary.gross_income)}
                muted
              />
              <Row
                label={he.dailyWidget.expenses}
                value={`-${formatILS(summary.expenses_total)}`}
                muted
              />
              <div className="my-1 border-t border-border/60" />
              <Row
                label={he.dailyWidget.net}
                value={formatILS(net)}
                bold
                colored={net !== 0}
                positive={net >= 0}
              />
              <p className="text-xs text-muted-foreground">
                {he.dailyWidget.txCount(
                  summary.income_count + summary.expense_count,
                )}
              </p>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

function Row({
  label,
  value,
  muted,
  bold,
  colored,
  positive,
}: {
  label: string;
  value: string;
  muted?: boolean;
  bold?: boolean;
  colored?: boolean;
  positive?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span
        className={cn(
          "text-sm",
          muted ? "text-muted-foreground" : "text-foreground",
          bold && "font-semibold",
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "num tabular-nums text-sm",
          bold && "font-semibold",
          colored && positive && "text-success",
          colored && !positive && "text-destructive",
        )}
      >
        {value}
      </span>
    </div>
  );
}
