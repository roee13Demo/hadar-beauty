"use client";

import { ChartContainer, PieChart, Pie, Cell } from "./_chart-shell";
import { ResponsiveContainer, Tooltip } from "recharts";
import { formatILS, formatPercent } from "@/lib/utils";
import { useChartColors } from "@/lib/theme";
import { he } from "@/lib/i18n/he";
import type { ExpenseBreakdownEntry } from "@/lib/calculations/aggregations";

interface ExpenseBreakdownChartProps {
  entries: ExpenseBreakdownEntry[];
}

export function ExpenseBreakdownChart({ entries }: ExpenseBreakdownChartProps) {
  const { colors, pie } = useChartColors();

  const tooltipStyle: React.CSSProperties = {
    background: colors.card,
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    fontSize: 12,
    direction: "rtl",
    color: colors.muted,
  };

  if (entries.length === 0) {
    return (
      <ChartContainer
        title={he.analytics.expenseBreakdown.title}
        subtitle={he.analytics.expenseBreakdown.subtitle}
      >
        <EmptyChart message={he.analytics.expenseBreakdown.empty} />
      </ChartContainer>
    );
  }

  const total = entries.reduce((sum, e) => sum + e.total, 0);
  const data = entries.map((e, idx) => ({
    name: e.category,
    value: e.total,
    share: e.share,
    fill: pie[idx % pie.length],
  }));

  return (
    <ChartContainer
      title={he.analytics.expenseBreakdown.title}
      subtitle={he.analytics.expenseBreakdown.subtitle}
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_240px]">
        <div className="h-64 w-full" style={{ direction: "ltr" }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                stroke={colors.card}
                strokeWidth={2}
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => formatILS(value)}
                contentStyle={tooltipStyle}
                wrapperStyle={{ outline: "none" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-col gap-3 self-center">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            סך הכל: {formatILS(total)}
          </div>
          <ul className="flex flex-col gap-2">
            {data.map((entry) => (
              <li key={entry.name} className="flex items-center gap-2 text-sm">
                <span
                  className="h-3 w-3 shrink-0 rounded-sm"
                  style={{ background: entry.fill }}
                />
                <span className="flex-1 truncate">{entry.name}</span>
                <span className="num text-xs tabular-nums text-muted-foreground">
                  {formatPercent(entry.share, 0)}
                </span>
                <span className="num text-sm tabular-nums">
                  {formatILS(entry.value)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </ChartContainer>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border/70 bg-card/40">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
