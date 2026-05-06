"use client";

import { useMemo } from "react";
import { Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatILS } from "@/lib/utils";
import { he } from "@/lib/i18n/he";
import type { Service, Transaction } from "@/lib/db/schema";

interface Props {
  todayTransactions: Transaction[];
  services: Service[];
}

interface HourlyStats {
  totalMinutes: number;
  totalNet: number;
  serviceCount: number;
  ratePerHour: number;
}

function computeHourlyStats(
  todayTx: Transaction[],
  services: Service[],
): HourlyStats | null {
  const serviceMap = new Map(services.map((s) => [s.id, s]));
  let totalMinutes = 0;
  let totalNet = 0;
  let serviceCount = 0;

  for (const t of todayTx) {
    if (t.type !== "income") continue;
    totalNet += t.net_profit;
    if (t.service_id) {
      const svc = serviceMap.get(t.service_id);
      if (svc) {
        totalMinutes += svc.duration_minutes;
        serviceCount++;
      }
    }
  }

  if (totalMinutes === 0 || serviceCount === 0) return null;

  return {
    totalMinutes,
    totalNet,
    serviceCount,
    ratePerHour: totalNet / (totalMinutes / 60),
  };
}

function formatHours(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h}`;
  return `${h}:${String(m).padStart(2, "0")}`;
}

export function HourlyRateCard({ todayTransactions, services }: Props) {
  const stats = useMemo(
    () => computeHourlyStats(todayTransactions, services),
    [todayTransactions, services],
  );

  if (!stats) {
    return (
      <Card>
        <CardContent className="flex items-center gap-4 p-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Clock className="h-5 w-5" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-muted-foreground">
              {he.hourlyRate.noDataTitle}
            </span>
            <span className="text-xs text-muted-foreground/70">
              {he.hourlyRate.noDataHint}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const rate = Math.round(stats.ratePerHour);

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 p-5">
        {/* Icon */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/20 text-accent-foreground">
          <Clock className="h-5 w-5 text-primary" />
        </div>

        {/* Left: hours + service count */}
        <div className="flex flex-1 flex-col gap-0.5">
          <span className="text-sm font-medium">
            {he.hourlyRate.hoursWorked(formatHours(stats.totalMinutes))}
          </span>
          <span className="text-xs text-muted-foreground">
            {he.hourlyRate.fromServices(stats.serviceCount)}
            {" · "}
            {he.hourlyRate.netToday}: {formatILS(stats.totalNet)}
          </span>
        </div>

        {/* Right: big rate */}
        <div className="flex flex-col items-end">
          <span className="num text-2xl font-bold tabular-nums text-primary">
            {formatILS(rate)}
          </span>
          <span className="text-xs text-muted-foreground">
            {he.hourlyRate.rateLabel}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
