"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn, formatILS, formatPercent } from "@/lib/utils";
import { computeMargin, ISRAELI_VAT_RATE } from "@/lib/calculations/margin";
import { he } from "@/lib/i18n/he";

interface MarginPreviewProps {
  price: number;
  materialCost: number;
  /**
   * When set, this value is added to the price and the entire breakdown
   * is computed on the inclusive amount (gross + add-on).
   */
  colorAddOn?: number;
}

export function MarginPreview({
  price,
  materialCost,
  colorAddOn,
}: MarginPreviewProps) {
  const safeBase = Number.isFinite(price) ? price : 0;
  const safeAddOn =
    typeof colorAddOn === "number" && Number.isFinite(colorAddOn)
      ? colorAddOn
      : 0;
  const safeMaterial = Number.isFinite(materialCost) ? materialCost : 0;

  const effectivePrice = safeBase + safeAddOn;
  const hasColorAddOn = typeof colorAddOn === "number" && safeAddOn > 0;

  const breakdown = computeMargin({
    price: effectivePrice,
    materialCost: safeMaterial,
    taxRate: ISRAELI_VAT_RATE,
  });

  const showWarning =
    effectivePrice > 0 && !breakdown.isHealthy && breakdown.netProfit > 0;
  const showLoss = effectivePrice > 0 && breakdown.netProfit <= 0;

  const priceLabel = hasColorAddOn
    ? he.services.preview.priceWithColor
    : he.services.preview.price;

  return (
    <div className="rounded-xl border border-border/70 bg-secondary/40 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-tight">
          {he.services.preview.title}
        </h3>
        {effectivePrice > 0 && breakdown.isHealthy && (
          <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-xs font-medium text-success">
            <CheckCircle2 className="h-3 w-3" />
            {he.services.preview.healthy}
          </span>
        )}
      </div>

      <dl className="flex flex-col gap-2.5 text-sm">
        <Row label={priceLabel} value={formatILS(effectivePrice)} />
        {hasColorAddOn && (
          <Row
            label={he.services.preview.basePrice}
            value={formatILS(safeBase)}
            muted
            small
          />
        )}
        <Row
          label={he.services.preview.materialCost}
          value={`-${formatILS(safeMaterial)}`}
          muted
        />
        <Row
          label={he.services.preview.tax}
          value={`-${formatILS(breakdown.taxOwed)}`}
          muted
        />

        <div className="my-1 border-t border-dashed border-border" />

        <Row
          label={he.services.preview.netProfit}
          value={formatILS(breakdown.netProfit)}
          emphasis
          tone={
            breakdown.netProfit <= 0
              ? "destructive"
              : breakdown.isHealthy
                ? "success"
                : "warning"
          }
        />
        <Row
          label={he.services.preview.margin}
          value={
            effectivePrice > 0
              ? formatPercent(breakdown.marginPercent, 0)
              : "-"
          }
          muted
        />
      </dl>

      {showWarning && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-accent/40 bg-accent/10 p-3 text-xs text-foreground">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-accent-foreground" />
          <span>{he.services.preview.lowMarginWarning}</span>
        </div>
      )}

      {showLoss && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>הטיפול מפסיד - בדקי שוב את המחיר ועלות החומרים</span>
        </div>
      )}
    </div>
  );
}

interface RowProps {
  label: string;
  value: string;
  muted?: boolean;
  emphasis?: boolean;
  small?: boolean;
  tone?: "success" | "warning" | "destructive";
}

function Row({ label, value, muted, emphasis, small, tone }: RowProps) {
  const toneColor =
    tone === "success"
      ? "text-success"
      : tone === "destructive"
        ? "text-destructive"
        : tone === "warning"
          ? "text-foreground"
          : undefined;

  return (
    <div className="flex items-baseline justify-between">
      <dt
        className={cn(
          small ? "text-xs" : "text-sm",
          muted ? "text-muted-foreground" : "text-foreground",
        )}
      >
        {label}
      </dt>
      <dd
        className={cn(
          "num tabular-nums",
          small ? "text-xs" : "text-sm",
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
