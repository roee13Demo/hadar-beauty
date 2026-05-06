"use client";

import { Sparkles, Trophy, CalendarHeart, Wallet } from "lucide-react";
import { format } from "date-fns";
import { he as heLocale } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { formatILS, formatPercent } from "@/lib/utils";
import { he } from "@/lib/i18n/he";
import type {
  BestDayResult,
  ServicePerformance,
  TopPaymentMethodResult,
} from "@/lib/calculations/aggregations";

interface InsightCardsProps {
  topService: ServicePerformance | null;
  bestDay: BestDayResult | null;
  topPayment: TopPaymentMethodResult | null;
}

/**
 * Three "fun fact" cards for the bottom of the dashboard.
 * Designed to fit a 1/2/3 column responsive grid.
 */
export function InsightCards({
  topService,
  bestDay,
  topPayment,
}: InsightCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <TopServiceMini top={topService} />
      <BestDayCard best={bestDay} />
      <TopPaymentCard top={topPayment} />
    </div>
  );
}

// ─── Card 1: Top service of the month ───────────────────────────────────────

function TopServiceMini({ top }: { top: ServicePerformance | null }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-5 pt-5">
        <Header
          icon={<Trophy className="h-4 w-4" />}
          tone="primary"
          label={he.dashboard.insights.topService.label}
        />
        {top ? (
          <>
            <div className="text-lg font-semibold leading-tight">
              {top.display_name_he}
            </div>
            <div className="num text-2xl font-semibold tabular-nums text-success">
              {formatILS(top.net_profit)}
            </div>
            <div className="text-xs text-muted-foreground">
              {he.dashboard.insights.topService.countAndAvg(
                top.count,
                formatILS(top.avg_net),
              )}
            </div>
          </>
        ) : (
          <EmptyMessage message={he.dashboard.insights.topService.empty} />
        )}
      </CardContent>
    </Card>
  );
}

// ─── Card 2: Best (most profitable) day of the month ────────────────────────

function BestDayCard({ best }: { best: BestDayResult | null }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-5 pt-5">
        <Header
          icon={<CalendarHeart className="h-4 w-4" />}
          tone="success"
          label={he.dashboard.insights.bestDay.label}
        />
        {best ? (
          <>
            <div className="text-lg font-semibold leading-tight">
              {format(parseIsoDate(best.date), "EEEE, d בMMMM", {
                locale: heLocale,
              })}
            </div>
            <div className="num text-2xl font-semibold tabular-nums text-success">
              {formatILS(best.net_profit)}
            </div>
            <div className="text-xs text-muted-foreground">
              {he.dashboard.insights.bestDay.netLabel}
            </div>
          </>
        ) : (
          <EmptyMessage message={he.dashboard.insights.bestDay.empty} />
        )}
      </CardContent>
    </Card>
  );
}

// ─── Card 3: Most-used payment method ───────────────────────────────────────

function TopPaymentCard({ top }: { top: TopPaymentMethodResult | null }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-5 pt-5">
        <Header
          icon={<Wallet className="h-4 w-4" />}
          tone="accent"
          label={he.dashboard.insights.topPayment.label}
        />
        {top ? (
          <>
            <div className="text-lg font-semibold leading-tight">
              {he.paymentMethods[top.method]}
            </div>
            <div className="num text-2xl font-semibold tabular-nums text-foreground">
              {formatPercent(top.share, 0)}
            </div>
            <div className="text-xs text-muted-foreground">
              {he.dashboard.insights.topPayment.countLabel(top.count)}
            </div>
          </>
        ) : (
          <EmptyMessage message={he.dashboard.insights.topPayment.empty} />
        )}
      </CardContent>
    </Card>
  );
}

// ─── Internal helpers ───────────────────────────────────────────────────────

type HeaderTone = "primary" | "success" | "accent";

function Header({
  icon,
  tone,
  label,
}: {
  icon: React.ReactNode;
  tone: HeaderTone;
  label: string;
}) {
  const toneClass =
    tone === "primary"
      ? "bg-primary/10 text-primary"
      : tone === "success"
        ? "bg-success/15 text-success"
        : "bg-accent/30 text-foreground";
  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-md ${toneClass}`}
      >
        {icon}
      </div>
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

function EmptyMessage({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Sparkles className="h-3.5 w-3.5" />
      <span>{message}</span>
    </div>
  );
}

/** Parses an ISO `YYYY-MM-DD` date as a local date (avoids UTC shift). */
function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}
