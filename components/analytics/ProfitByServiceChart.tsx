"use client";

import { BarChart, ChartContainer } from "./_chart-shell";
import {
  Bar,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatILS } from "@/lib/utils";
import { useChartColors } from "@/lib/theme";
import { he } from "@/lib/i18n/he";
import type { ServicePerformance } from "@/lib/calculations/aggregations";

interface ProfitByServiceChartProps {
  rows: ServicePerformance[];
}

export function ProfitByServiceChart({ rows }: ProfitByServiceChartProps) {
  const { colors } = useChartColors();

  if (rows.length === 0) {
    return (
      <ChartContainer
        title={he.analytics.profitByService.title}
        subtitle={he.analytics.profitByService.subtitle}
      >
        <EmptyChart message={he.analytics.profitByService.empty} />
      </ChartContainer>
    );
  }

  const data = rows.map((r) => ({
    name: r.display_name_he,
    net: Math.round(r.net_profit * 100) / 100,
    count: r.count,
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
      title={he.analytics.profitByService.title}
      subtitle={he.analytics.profitByService.subtitle}
    >
      <div className="h-72 w-full" style={{ direction: "ltr" }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 12, left: 12, bottom: 4 }}>
            <CartesianGrid stroke={colors.border} strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12, fill: colors.muted }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: colors.muted }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}₪`}
              width={60}
            />
            <Tooltip
              cursor={{ fill: colors.border, opacity: 0.4 }}
              contentStyle={tooltipStyle}
              formatter={(value: number, name) => {
                if (name === he.analytics.profitByService.legendNet) {
                  return [formatILS(value), he.analytics.profitByService.legendNet];
                }
                return [value, name];
              }}
              wrapperStyle={{ outline: "none" }}
            />
            <Bar
              dataKey="net"
              name={he.analytics.profitByService.legendNet}
              fill={colors.primary}
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartContainer>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-72 items-center justify-center rounded-lg border border-dashed border-border/70 bg-card/40">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
