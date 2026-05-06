"use client";

import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { PageHeader } from "@/components/layout/PageHeader";
import { PeriodSelector, type PeriodOption } from "@/components/analytics/PeriodSelector";
import { PeriodSummaryCards } from "@/components/analytics/PeriodSummaryCards";
import { RevenueTrendChart } from "@/components/analytics/RevenueTrendChart";
import { ProfitByServiceChart } from "@/components/analytics/ProfitByServiceChart";
import { ExpenseBreakdownChart } from "@/components/analytics/ExpenseBreakdownChart";
import { YearlyComparisonChart } from "@/components/analytics/YearlyComparisonChart";
import { ExportTools } from "@/components/analytics/ExportTools";
import { listTransactions } from "@/lib/db/transactions";
import { listServices } from "@/lib/db/services";
import {
  computeDailyTimeseries,
  computeExpenseBreakdown,
  computeServicePerformance,
  summarizePeriod,
} from "@/lib/calculations/aggregations";
import { getLastNDaysRange, isInRange } from "@/lib/calculations/period";
import { he } from "@/lib/i18n/he";

const PERIOD_TO_LABEL: Record<PeriodOption, string> = {
  7: "7d",
  30: "30d",
  90: "90d",
  365: "1y",
};

export default function AnalyticsPage() {
  const transactions = useLiveQuery(() => listTransactions(), [], []);
  const services = useLiveQuery(() => listServices(), [], []);

  const [period, setPeriod] = useState<PeriodOption>(30);

  const range = useMemo(() => getLastNDaysRange(period), [period]);

  const periodTransactions = useMemo(
    () => (transactions ?? []).filter((t) => isInRange(t.date, range)),
    [transactions, range],
  );

  const totals = useMemo(
    () => summarizePeriod(transactions ?? [], range),
    [transactions, range],
  );

  const timeseries = useMemo(
    () => computeDailyTimeseries(transactions ?? [], range),
    [transactions, range],
  );

  const servicePerf = useMemo(
    () =>
      computeServicePerformance(
        transactions ?? [],
        services ?? [],
        range,
        (c) => he.categories[c],
      ),
    [transactions, services, range],
  );

  const expenseBreakdown = useMemo(
    () => computeExpenseBreakdown(transactions ?? [], range),
    [transactions, range],
  );

  const servicesById = useMemo(() => {
    const map = new Map();
    for (const s of services ?? []) map.set(s.id, s);
    return map;
  }, [services]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={he.analytics.pageTitle}
        subtitle={he.analytics.pageSubtitle}
        actions={<PeriodSelector value={period} onChange={setPeriod} />}
      />

      <PeriodSummaryCards totals={totals} />

      <RevenueTrendChart data={timeseries} />

      <div className="grid gap-6 lg:grid-cols-2">
        <ProfitByServiceChart rows={servicePerf} />
        <ExpenseBreakdownChart entries={expenseBreakdown} />
      </div>

      <YearlyComparisonChart transactions={transactions ?? []} />

      <ExportTools
        periodTransactions={periodTransactions}
        servicesById={servicesById}
        periodLabel={PERIOD_TO_LABEL[period]}
      />
    </div>
  );
}
