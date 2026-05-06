"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { format } from "date-fns";
import { he as heLocale } from "date-fns/locale";
import { useLiveQuery } from "dexie-react-hooks";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MotivationalQuote } from "@/components/dashboard/MotivationalQuote";
import { MonthlyGoalCard } from "@/components/dashboard/MonthlyGoalCard";
import { PendingRecurringBanner } from "@/components/dashboard/PendingRecurringBanner";
import { TodayCards } from "@/components/dashboard/TodayCards";
import { MonthCards } from "@/components/dashboard/MonthCards";
import { AlertCards } from "@/components/dashboard/AlertCards";
import { InsightCards } from "@/components/dashboard/InsightCards";
import { HourlyRateCard } from "@/components/dashboard/HourlyRateCard";
import { WeeklySummarySheet } from "@/components/dashboard/WeeklySummarySheet";
import { listTransactions } from "@/lib/db/transactions";
import { listServices } from "@/lib/db/services";
import { listInventoryItems } from "@/lib/db/inventory";
import { getSettings, readSettings } from "@/lib/db/settings";
import {
  computeServicePerformance,
  pickBestDay,
  pickTopPaymentMethod,
  pickTopService,
  summarizePeriod,
} from "@/lib/calculations/aggregations";
import {
  getMonthToDateRange,
  getPriorMonthSameRange,
  getTodayRange,
  isInRange,
} from "@/lib/calculations/period";
import { useTimeOfDay } from "@/lib/timeOfDay";
import { he } from "@/lib/i18n/he";

export default function DashboardPage() {
  // Ensure settings row is seeded with defaults once on mount.
  // getSettings() contains writes, so it must NOT be called inside useLiveQuery.
  useEffect(() => { getSettings(); }, []);

  const transactions = useLiveQuery(() => listTransactions(), [], []);
  const services = useLiveQuery(() => listServices(), [], []);
  const inventory = useLiveQuery(() => listInventoryItems(), [], []);
  // readSettings() is a pure read — safe for useLiveQuery
  const settings = useLiveQuery(() => readSettings(), []);

  const now = useMemo(() => new Date(), []);
  const todayRange = useMemo(() => getTodayRange(now), [now]);
  const monthRange = useMemo(() => getMonthToDateRange(now), [now]);
  const priorRange = useMemo(() => getPriorMonthSameRange(now), [now]);

  const todayTotals = useMemo(
    () => summarizePeriod(transactions ?? [], todayRange),
    [transactions, todayRange],
  );
  const monthTotals = useMemo(
    () => summarizePeriod(transactions ?? [], monthRange),
    [transactions, monthRange],
  );
  const priorTotals = useMemo(
    () => summarizePeriod(transactions ?? [], priorRange),
    [transactions, priorRange],
  );

  const topService = useMemo(() => {
    const rows = computeServicePerformance(
      transactions ?? [],
      services ?? [],
      monthRange,
      (c) => he.categories[c],
    );
    return pickTopService(rows);
  }, [transactions, services, monthRange]);

  const bestDay = useMemo(
    () => pickBestDay(transactions ?? [], monthRange),
    [transactions, monthRange],
  );

  const topPayment = useMemo(
    () => pickTopPaymentMethod(transactions ?? [], monthRange),
    [transactions, monthRange],
  );

  const todayTransactions = useMemo(
    () => (transactions ?? []).filter((t) => isInRange(t.date, todayRange)),
    [transactions, todayRange],
  );

  const dateLabel = format(now, "EEEE, d בMMMM yyyy", { locale: heLocale });
  const period = useTimeOfDay();

  return (
    <div className="flex flex-col gap-8">
      {/* Welcome hero */}
      <div className="flex flex-col gap-4 border-b border-border/60 pb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-semibold tracking-tight">
              {period.greeting("הדר")}
            </h1>
            <p className="text-sm text-muted-foreground">{dateLabel}</p>
          </div>
          <Button asChild className="shrink-0">
            <Link href="/transactions">
              <Plus className="h-4 w-4" />
              {he.dashboard.quickAddTransaction}
            </Link>
          </Button>
        </div>
        <MotivationalQuote />
      </div>

      <PendingRecurringBanner />

      <Section title={he.dashboard.sectionGoal}>
        <MonthlyGoalCard
          goal={settings?.monthly_net_goal_ils ?? 0}
          achieved={monthTotals.net_profit}
        />
      </Section>

      <Section title={he.dashboard.sectionToday}>
        <TodayCards totals={todayTotals} />
        <HourlyRateCard
          todayTransactions={todayTransactions}
          services={services ?? []}
        />
      </Section>

      <Section title={he.dashboard.sectionMonth}>
        <MonthCards current={monthTotals} prior={priorTotals} />
      </Section>

      <Section title={he.dashboard.sectionAlerts}>
        <AlertCards items={inventory ?? []} />
      </Section>

      <Section title={he.dashboard.sectionInsights}>
        <InsightCards
          topService={topService}
          bestDay={bestDay}
          topPayment={topPayment}
        />
      </Section>

      <WeeklySummarySheet
        transactions={transactions ?? []}
        services={services ?? []}
      />
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
      {children}
    </section>
  );
}
