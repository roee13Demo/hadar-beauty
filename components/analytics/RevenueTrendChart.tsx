"use client";

import { LineChart, ChartContainer } from "./_chart-shell";
import {
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { format } from "date-fns";
import { he as heLocale } from "date-fns/locale";
import { formatILS } from "@/lib/utils";
import { useChartColors } from "@/lib/theme";
import { he } from "@/lib/i18n/he";
import type { DailyAggregate } from "@/lib/calculations/aggregations";

interface RevenueTrendChartProps {
  data: DailyAggregate[];
}

export function RevenueTrendChart({ data }: RevenueTrendChartProps) {
  const { colors } = useChartColors();
  const isEmpty = data.every(
    (d) => d.gross_income === 0 && d.net_profit === 0,
  );

  if (isEmpty) {
    return (
      <ChartContainer
        title={he.analytics.revenueTrend.title}
        subtitle={he.analytics.revenueTrend.subtitle}
      >
        <EmptyChart message={he.analytics.revenueTrend.empty} />
      </ChartContainer>
    );
  }

  const enriched = data.map((d) => ({
    ...d,
    label: formatTickLabel(d.date, data.length),
  }));

  const tooltipStyle: React.CSSProperties = {
    background: colors.card,
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    fontSize: 12,
    direction: "rtl",
    color: colors.muted,
  };

  return (
    <ChartContainer
      title={he.analytics.revenueTrend.title}
      subtitle={he.analytics.revenueTrend.subtitle}
    >
      <div className="h-72 w-full" style={{ direction: "ltr" }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={enriched}
            margin={{ top: 20, right: 12, left: 12, bottom: 4 }}
          >
            <CartesianGrid stroke={colors.border} strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: colors.muted }}
              tickLine={false}
              axisLine={false}
              minTickGap={20}
            />
            <YAxis
              tick={{ fontSize: 11, fill: colors.muted }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}₪`}
              width={60}
            />
            <Tooltip
              formatter={(value: number) => formatILS(value)}
              labelFormatter={(label, payload) => {
                const original = payload?.[0]?.payload as
                  | DailyAggregate
                  | undefined;
                if (!original) return label;
                const d = new Date(original.date);
                return format(d, "EEEE, d בMMMM", { locale: heLocale });
              }}
              contentStyle={tooltipStyle}
              labelStyle={{ direction: "rtl", textAlign: "right" }}
              wrapperStyle={{ outline: "none" }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="line"
              wrapperStyle={{
                direction: "rtl",
                fontSize: 12,
                paddingBottom: 12,
              }}
            />
            <Line
              type="monotone"
              dataKey="gross_income"
              name={he.analytics.revenueTrend.legendIncome}
              stroke={colors.success}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="net_profit"
              name={he.analytics.revenueTrend.legendNet}
              stroke={colors.primary}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartContainer>
  );
}

function formatTickLabel(iso: string, total: number): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  if (total <= 14) {
    return format(d, "d/M", { locale: heLocale });
  }
  if (total <= 90) {
    return format(d, "d/M", { locale: heLocale });
  }
  return format(d, "MMM yy", { locale: heLocale });
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-72 items-center justify-center rounded-lg border border-dashed border-border/70 bg-card/40">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
