"use client";

import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from "recharts";
import { computeYearlyTimeseries } from "@/lib/calculations/aggregations";
import type { Transaction } from "@/lib/db/schema";
import { formatILS } from "@/lib/utils";
import { he } from "@/lib/i18n/he";
import { useChartColors } from "@/lib/theme";
import { cn } from "@/lib/utils";

type Metric = "net_profit" | "gross_income" | "expenses";

const METRIC_OPTIONS: { value: Metric; label: string }[] = [
  { value: "net_profit", label: he.yearlyChart.metricNet },
  { value: "gross_income", label: he.yearlyChart.metricGross },
  { value: "expenses", label: he.yearlyChart.metricExpenses },
];

interface Props {
  transactions: Transaction[];
}

export function YearlyComparisonChart({ transactions }: Props) {
  const { colors } = useChartColors();
  const currentYear = new Date().getFullYear();

  const [metric, setMetric] = useState<Metric>("net_profit");
  const [showLastYear, setShowLastYear] = useState(false);

  const thisYearData = useMemo(
    () => computeYearlyTimeseries(transactions, currentYear),
    [transactions, currentYear],
  );

  const lastYearData = useMemo(
    () =>
      showLastYear
        ? computeYearlyTimeseries(transactions, currentYear - 1)
        : null,
    [transactions, currentYear, showLastYear],
  );

  // Merge into chart-friendly shape
  const chartData = useMemo(
    () =>
      thisYearData.map((d, i) => ({
        label: d.label,
        thisYear: Math.round(d[metric]),
        ...(lastYearData ? { lastYear: Math.round(lastYearData[i][metric]) } : {}),
      })),
    [thisYearData, lastYearData, metric],
  );

  const hasAnyData = thisYearData.some((d) => d[metric] !== 0);

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border/70 bg-card p-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-sm font-semibold">{he.yearlyChart.title}</h3>
          <p className="text-xs text-muted-foreground">
            {he.yearlyChart.subtitle} — {currentYear}
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Metric selector */}
          <div className="flex rounded-lg border border-border bg-muted/40 p-0.5">
            {METRIC_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setMetric(opt.value)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-all",
                  metric === opt.value
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Compare toggle */}
          <button
            onClick={() => setShowLastYear((v) => !v)}
            className={cn(
              "rounded-lg border px-2.5 py-1 text-xs font-medium transition-all",
              showLastYear
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border text-muted-foreground",
            )}
          >
            {he.yearlyChart.toggleComparison}
          </button>
        </div>
      </div>

      {/* Chart */}
      {!hasAnyData ? (
        <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
          {he.yearlyChart.noData}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={chartData}
            margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
            barCategoryGap="30%"
            barGap={3}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={colors.border}
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: colors.muted }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: colors.muted }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) =>
                `₪${Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`
              }
              width={44}
            />
            <ReferenceLine y={0} stroke={colors.border} strokeWidth={1.5} />
            <Tooltip
              formatter={(value: number, name: string) => [
                formatILS(value),
                name === "thisYear"
                  ? he.yearlyChart.thisYear
                  : he.yearlyChart.lastYear,
              ]}
              contentStyle={{
                background: colors.card,
                border: `1px solid ${colors.border}`,
                borderRadius: "8px",
                fontSize: "12px",
              }}
              labelStyle={{ color: colors.primary, fontWeight: 600 }}
            />
            {showLastYear && (
              <Legend
                formatter={(value) =>
                  value === "thisYear"
                    ? he.yearlyChart.thisYear
                    : he.yearlyChart.lastYear
                }
                wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
              />
            )}
            <Bar
              dataKey="thisYear"
              name="thisYear"
              fill={colors.primary}
              radius={[4, 4, 0, 0]}
              maxBarSize={36}
            />
            {showLastYear && (
              <Bar
                dataKey="lastYear"
                name="lastYear"
                fill={colors.muted}
                radius={[4, 4, 0, 0]}
                maxBarSize={36}
                opacity={0.6}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
