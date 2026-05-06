"use client";

import Link from "next/link";
import { Sparkles, Trophy, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatILS } from "@/lib/utils";
import { he } from "@/lib/i18n/he";
import type { ServicePerformance } from "@/lib/calculations/aggregations";

interface TopServiceCardProps {
  top: ServicePerformance | null;
}

export function TopServiceCard({ top }: TopServiceCardProps) {
  if (!top) {
    return (
      <Card>
        <CardContent className="flex items-center gap-4 p-5 pt-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">
              {he.dashboard.sectionTopService}
            </span>
            <span className="text-sm text-muted-foreground">
              {he.dashboard.topService.empty}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-5 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Trophy className="h-5 w-5" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {he.dashboard.sectionTopService}
            </span>
            <span className="text-xl font-semibold">{top.display_name_he}</span>
            <span className="text-xs text-muted-foreground">
              {he.dashboard.topService.countLabel(top.count)} ·{" "}
              {he.dashboard.topService.avgLabel(formatILS(top.avg_net))}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-start gap-1 sm:items-end">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            {he.dashboard.topService.netLabel}
          </span>
          <span className="num text-2xl font-semibold tabular-nums text-success">
            {formatILS(top.net_profit)}
          </span>
          <Link
            href="/services"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            ניהול טיפולים
            <ArrowLeft className="h-3 w-3 rtl:rotate-180" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
