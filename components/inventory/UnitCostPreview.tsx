"use client";

import { Calculator } from "lucide-react";
import { computeUnitCost } from "@/lib/calculations/unit-cost";
import { formatILS, cn } from "@/lib/utils";
import { he } from "@/lib/i18n/he";
import type { InventoryUnit } from "@/lib/db/schema";

interface UnitCostPreviewProps {
  bulkCost: number;
  bulkQuantity: number;
  currentStock: number;
  unitType: InventoryUnit | null;
}

export function UnitCostPreview({
  bulkCost,
  bulkQuantity,
  currentStock,
  unitType,
}: UnitCostPreviewProps) {
  const safeCost = Number.isFinite(bulkCost) ? bulkCost : 0;
  const safeQty = Number.isFinite(bulkQuantity) ? bulkQuantity : 0;
  const safeStock = Number.isFinite(currentStock) ? currentStock : 0;

  const { costPerUnit, stockValue } = computeUnitCost({
    bulkCost: safeCost,
    bulkQuantity: safeQty,
    currentStock: safeStock,
  });

  const unitShort = unitType ? he.units[unitType].short : "";

  return (
    <div className="rounded-xl border border-border/70 bg-secondary/40 p-5">
      <div className="mb-4 flex items-center gap-2">
        <Calculator className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold tracking-tight">
          {he.inventory.preview.title}
        </h3>
      </div>

      {!unitType ? (
        <p className="text-sm text-muted-foreground">
          {he.inventory.preview.noUnit}
        </p>
      ) : (
        <dl className="flex flex-col gap-2.5 text-sm">
          <Row
            label={he.inventory.preview.bulkCost}
            value={formatILS(safeCost)}
            muted
          />
          <Row
            label={he.inventory.preview.bulkQuantity}
            value={`${safeQty} ${unitShort}`}
            muted
          />
          <div className="my-1 border-t border-dashed border-border" />
          <Row
            label={`${he.inventory.preview.costPerUnit} (ל-${unitShort})`}
            value={formatILSDecimal(costPerUnit)}
            emphasis
          />
          <div className="my-1 border-t border-dashed border-border" />
          <Row
            label={he.inventory.preview.currentStock}
            value={`${safeStock} ${unitShort}`}
            muted
          />
          <Row
            label={he.inventory.preview.stockValue}
            value={formatILS(stockValue)}
            tone="success"
          />
        </dl>
      )}
    </div>
  );
}

function formatILSDecimal(value: number): string {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

interface RowProps {
  label: string;
  value: string;
  muted?: boolean;
  emphasis?: boolean;
  tone?: "success";
}

function Row({ label, value, muted, emphasis, tone }: RowProps) {
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
          tone === "success" && "text-success",
          muted && !emphasis && !tone && "text-muted-foreground",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
