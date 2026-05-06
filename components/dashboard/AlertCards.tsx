"use client";

import Link from "next/link";
import { AlertTriangle, CalendarClock, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { he } from "@/lib/i18n/he";
import { cn } from "@/lib/utils";
import type { InventoryItem } from "@/lib/db/schema";
import { assessExpiry } from "@/lib/calculations/expiry";

interface AlertCardsProps {
  items: InventoryItem[];
}

export function AlertCards({ items }: AlertCardsProps) {
  const lowStock = items.filter(
    (i) => i.current_stock_units <= i.low_stock_threshold,
  );
  const expiring = items.filter((i) => {
    const status = assessExpiry(i.expiry_date).status;
    return status === "expiring_soon" || status === "expired";
  });

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <AlertCard
        title={he.dashboard.alerts.lowStockTitle}
        items={lowStock}
        emptyMessage={he.dashboard.alerts.noLowStock}
        icon={AlertTriangle}
        tone="warning"
      />
      <AlertCard
        title={he.dashboard.alerts.expiringTitle}
        items={expiring}
        emptyMessage={he.dashboard.alerts.noExpiring}
        icon={CalendarClock}
        tone="destructive"
      />
    </div>
  );
}

interface AlertCardProps {
  title: string;
  items: InventoryItem[];
  emptyMessage: string;
  icon: typeof AlertTriangle;
  tone: "warning" | "destructive";
}

function AlertCard({ title, items, emptyMessage, icon: Icon, tone }: AlertCardProps) {
  const isEmpty = items.length === 0;
  const iconClass = isEmpty
    ? "bg-success/15 text-success"
    : tone === "warning"
      ? "bg-accent/30 text-foreground"
      : "bg-destructive/10 text-destructive";

  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5 pt-5">
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg",
            iconClass,
          )}
        >
          {isEmpty ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : (
            <Icon className="h-5 w-5" />
          )}
        </div>
        <div className="flex flex-1 flex-col gap-0.5">
          <span className="text-sm font-medium">{title}</span>
          {isEmpty ? (
            <span className="text-sm text-muted-foreground">{emptyMessage}</span>
          ) : (
            <>
              <span className="text-2xl font-semibold tabular-nums">
                {he.dashboard.alerts.itemCount(items.length)}
              </span>
              <Link
                href="/inventory"
                className="mt-1 text-xs font-medium text-primary hover:underline"
              >
                {he.dashboard.alerts.goToInventory}
              </Link>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
