"use client";

import { useEffect, useState } from "react";
import { Receipt, TrendingUp, TrendingDown, Info } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { computeServiceCogs } from "@/lib/calculations/cogs";
import { ISRAELI_VAT_RATE } from "@/lib/calculations/margin";
import { listLinksForService } from "@/lib/db/service-materials";
import { cn, formatILS } from "@/lib/utils";
import { he } from "@/lib/i18n/he";
import type { Service } from "@/lib/db/schema";

interface IncomePreviewProps {
  variant: "income";
  service: Service | null;
  amountGross: number;
}

interface ExpensePreviewProps {
  variant: "expense";
  amountGross: number;
  expenseCategory: string | null;
}

type TransactionPreviewProps = IncomePreviewProps | ExpensePreviewProps;

export function TransactionPreview(props: TransactionPreviewProps) {
  if (props.variant === "expense") {
    return (
      <ExpensePreviewView
        amount={props.amountGross}
        category={props.expenseCategory}
      />
    );
  }
  return (
    <IncomePreviewView service={props.service} amountGross={props.amountGross} />
  );
}

function IncomePreviewView({
  service,
  amountGross,
}: {
  service: Service | null;
  amountGross: number;
}) {
  const safeAmount = Number.isFinite(amountGross) ? amountGross : 0;

  const links = useLiveQuery(
    () =>
      service ? listLinksForService(service.id) : Promise.resolve([]),
    [service?.id],
    [],
  );

  const [cogs, setCogs] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;
    if (!service) {
      setCogs(0);
      return;
    }
    computeServiceCogs(service.id).then((result) => {
      if (!cancelled) setCogs(result.total);
    });
    return () => {
      cancelled = true;
    };
  }, [service, links]);

  if (!service) {
    return (
      <div className="rounded-xl border border-border/70 bg-secondary/40 p-5">
        <div className="mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold tracking-tight">
            {he.transactions.preview.titleIncome}
          </h3>
        </div>
        <p className="text-sm text-muted-foreground">
          {he.transactions.preview.noService}
        </p>
      </div>
    );
  }

  const tax = safeAmount * ISRAELI_VAT_RATE;
  const netProfit = safeAmount - tax - cogs;
  const hasLinks = (links ?? []).length > 0;
  const isHealthy = safeAmount > 0 && netProfit / safeAmount >= 0.3;

  return (
    <div className="rounded-xl border border-border/70 bg-secondary/40 p-5">
      <div className="mb-4 flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-success" />
        <h3 className="text-sm font-semibold tracking-tight">
          {he.transactions.preview.titleIncome}
        </h3>
      </div>

      <div className="mb-3 text-xs text-muted-foreground">
        {he.categories[service.category]}
      </div>

      <dl className="flex flex-col gap-2.5 text-sm">
        <Row
          label={he.transactions.preview.gross}
          value={formatILS(safeAmount)}
        />
        <Row
          label={he.transactions.preview.tax}
          value={`-${formatILS(tax)}`}
          muted
        />
        <Row
          label={he.transactions.preview.cogs}
          value={`-${formatILS(cogs)}`}
          muted
        />

        <div className="my-1 border-t border-dashed border-border" />

        <Row
          label={he.transactions.preview.netProfit}
          value={formatILS(netProfit)}
          emphasis
          tone={
            netProfit <= 0
              ? "destructive"
              : isHealthy
                ? "success"
                : undefined
          }
        />
      </dl>

      {!hasLinks && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-border/70 bg-card/60 p-3 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{he.transactions.preview.noCogsHint}</span>
        </div>
      )}
      {hasLinks && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-border/70 bg-card/60 p-3 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{he.transactions.preview.cogsHint}</span>
        </div>
      )}
    </div>
  );
}

function ExpensePreviewView({
  amount,
  category,
}: {
  amount: number;
  category: string | null;
}) {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  return (
    <div className="rounded-xl border border-border/70 bg-secondary/40 p-5">
      <div className="mb-4 flex items-center gap-2">
        <TrendingDown className="h-4 w-4 text-destructive" />
        <h3 className="text-sm font-semibold tracking-tight">
          {he.transactions.preview.titleExpense}
        </h3>
      </div>
      {category && (
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-card px-2.5 py-1 text-xs text-muted-foreground">
          <Receipt className="h-3 w-3" />
          {category}
        </div>
      )}
      <dl className="flex flex-col gap-2">
        <Row
          label={he.transactions.preview.expenseAmount}
          value={`-${formatILS(safeAmount)}`}
          emphasis
          tone="destructive"
        />
      </dl>
    </div>
  );
}

interface RowProps {
  label: string;
  value: string;
  muted?: boolean;
  emphasis?: boolean;
  tone?: "success" | "destructive";
}

function Row({ label, value, muted, emphasis, tone }: RowProps) {
  const toneColor =
    tone === "success"
      ? "text-success"
      : tone === "destructive"
        ? "text-destructive"
        : undefined;
  return (
    <div className="flex items-baseline justify-between">
      <dt
        className={cn(
          "text-sm",
          muted ? "text-muted-foreground" : "text-foreground",
        )}
      >
        {label}
      </dt>
      <dd
        className={cn(
          "num text-sm tabular-nums",
          emphasis && "text-base font-semibold",
          toneColor,
          muted && !emphasis && "text-muted-foreground",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
