"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, Check } from "lucide-react";
import { format } from "date-fns";
import { he as heLocale } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { formatILS } from "@/lib/utils";
import { he } from "@/lib/i18n/he";
import { summarizePeriod } from "@/lib/calculations/aggregations";
import { pickBestDay } from "@/lib/calculations/aggregations";
import type { Transaction, Service } from "@/lib/db/schema";

const STORAGE_KEY = "hadar-beauty-weekly-summary-shown";

// ─── Date helpers ────────────────────────────────────────────────────────────

function toIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Returns the "Sunday-start week" key for a date, e.g. "2025-05-04" */
function sundayWeekKey(date: Date): string {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay()); // roll back to Sunday
  return toIso(d);
}

/** Returns the ISO range of the *previous* Sun-Sat week */
function getPreviousWeekRange(today: Date): { start: Date; end: Date } {
  const thisSunday = new Date(today);
  thisSunday.setDate(today.getDate() - today.getDay());
  thisSunday.setHours(0, 0, 0, 0);

  const lastSaturday = new Date(thisSunday);
  lastSaturday.setDate(thisSunday.getDate() - 1);

  const lastSunday = new Date(lastSaturday);
  lastSunday.setDate(lastSaturday.getDate() - 6);

  return { start: lastSunday, end: lastSaturday };
}

function formatWeekRange(start: Date, end: Date): string {
  const sameMonth = start.getMonth() === end.getMonth();
  if (sameMonth) {
    return `${start.getDate()}–${format(end, "d בMMMM", { locale: heLocale })}`;
  }
  return `${format(start, "d בMMM", { locale: heLocale })} – ${format(end, "d בMMM", { locale: heLocale })}`;
}

// ─── Component ───────────────────────────────────────────────────────────────

interface Props {
  transactions: Transaction[];
  services: Service[];
}

export function WeeklySummarySheet({ transactions, services }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const today = useMemo(() => new Date(), []);
  const currentWeekKey = useMemo(() => sundayWeekKey(today), [today]);
  const prevWeek = useMemo(() => getPreviousWeekRange(today), [today]);

  // Check on mount if we need to show the summary
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== currentWeekKey) {
      // Small delay so the page renders first
      const t = setTimeout(() => setOpen(true), 800);
      return () => clearTimeout(t);
    }
  }, [currentWeekKey]);

  const weekRange = useMemo(() => {
    const start = toIso(prevWeek.start);
    const end = toIso(prevWeek.end);
    const diffMs = prevWeek.end.getTime() - prevWeek.start.getTime();
    const days = Math.round(diffMs / 86400000) + 1;
    return { start, end, days };
  }, [prevWeek]);

  const totals = useMemo(
    () => summarizePeriod(transactions, weekRange),
    [transactions, weekRange],
  );

  const bestDayResult = useMemo(
    () => pickBestDay(transactions, weekRange),
    [transactions, weekRange],
  );

  // Top service by count this week
  const topService = useMemo(() => {
    const serviceMap = new Map(services.map((s) => [s.id, s]));
    const counts = new Map<string, number>();
    for (const t of transactions) {
      if (t.type !== "income") continue;
      if (t.date < weekRange.start || t.date > weekRange.end) continue;
      if (!t.service_id) continue;
      counts.set(t.service_id, (counts.get(t.service_id) ?? 0) + 1);
    }
    if (counts.size === 0) return null;
    let topId = "";
    let topCount = 0;
    for (const [id, count] of counts) {
      if (count > topCount) { topCount = count; topId = id; }
    }
    return serviceMap.get(topId) ?? null;
  }, [transactions, services, weekRange]);

  const rangeLabel = formatWeekRange(prevWeek.start, prevWeek.end);
  const hasData = totals.income_count + totals.expense_count > 0;

  const whatsappText = useMemo(() => {
    if (!hasData) return "";
    const lines = [
      `📊 סיכום שבועי — ${rangeLabel}`,
      "",
      `💰 הכנסות: ${formatILS(totals.gross_income)}`,
      `💸 הוצאות: ${formatILS(totals.expenses)}`,
      `✨ רווח נטו: ${formatILS(totals.bottom_line)}`,
      "",
    ];
    if (bestDayResult) {
      const dow = new Date(bestDayResult.date + "T12:00:00").getDay();
      const dayName = he.weeklySummary.days[dow];
      lines.push(`📅 יום הכי חזק: ${dayName} (${formatILS(bestDayResult.net_profit)})`);
    }
    if (topService) {
      lines.push(`🏆 טיפול מוביל: ${topService.name_he}`);
    }
    lines.push("");
    lines.push(
      `${he.weeklySummary.txCount(totals.income_count + totals.expense_count)} • הדר ביוטי`,
    );
    return lines.join("\n");
  }, [hasData, rangeLabel, totals, bestDayResult, topService]);

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, currentWeekKey);
    setOpen(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(whatsappText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select all in a textarea
    }
  };

  if (!open) return null;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && handleClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl pb-safe">
        <SheetHeader className="pb-4 text-start">
          <SheetTitle>{he.weeklySummary.title}</SheetTitle>
          <SheetDescription>
            {he.weeklySummary.subtitle(rangeLabel)}
          </SheetDescription>
        </SheetHeader>

        {!hasData ? (
          <p className="pb-6 text-sm text-muted-foreground">
            {he.weeklySummary.noTransactions}
          </p>
        ) : (
          <div className="flex flex-col gap-4 pb-6">
            {/* Stats rows */}
            <div className="flex flex-col gap-2 rounded-xl bg-muted/40 p-4">
              <StatRow label={he.weeklySummary.income} value={formatILS(totals.gross_income)} />
              <StatRow label={he.weeklySummary.expenses} value={`-${formatILS(totals.expenses)}`} muted />
              <div className="my-0.5 border-t border-border/50" />
              <StatRow
                label={he.weeklySummary.net}
                value={formatILS(totals.bottom_line)}
                bold
                colored
                positive={totals.bottom_line >= 0}
              />
            </div>

            {/* Highlights */}
            <div className="flex flex-col gap-1.5">
              {bestDayResult && (
                <HighlightRow
                  emoji="📅"
                  label={he.weeklySummary.bestDay}
                  value={`${he.weeklySummary.days[new Date(bestDayResult.date + "T12:00:00").getDay()]} — ${formatILS(bestDayResult.net_profit)}`}
                />
              )}
              {topService && (
                <HighlightRow
                  emoji="🏆"
                  label={he.weeklySummary.topService}
                  value={topService.name_he}
                />
              )}
              <HighlightRow
                emoji="🔢"
                label=""
                value={he.weeklySummary.txCount(totals.income_count + totals.expense_count)}
              />
            </div>

            {/* WhatsApp copy */}
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="h-4 w-4 text-success" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied ? he.weeklySummary.copied : he.weeklySummary.copyButton}
            </Button>
          </div>
        )}

        <Button className="w-full" onClick={handleClose}>
          {he.weeklySummary.dismissButton}
        </Button>
      </SheetContent>
    </Sheet>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatRow({
  label, value, muted, bold, colored, positive,
}: {
  label: string; value: string;
  muted?: boolean; bold?: boolean;
  colored?: boolean; positive?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-sm ${muted ? "text-muted-foreground" : ""} ${bold ? "font-semibold" : ""}`}>
        {label}
      </span>
      <span className={`num text-sm tabular-nums ${bold ? "font-semibold" : ""} ${colored && positive ? "text-success" : colored && !positive ? "text-destructive" : ""}`}>
        {value}
      </span>
    </div>
  );
}

function HighlightRow({ emoji, label, value }: { emoji: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span>{emoji}</span>
      {label && <span className="text-muted-foreground">{label}:</span>}
      <span className="font-medium">{value}</span>
    </div>
  );
}
