"use client";

import { MoreHorizontal, Pencil, Trash2, Package, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { he as heLocale } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { assessExpiry } from "@/lib/calculations/expiry";
import { he } from "@/lib/i18n/he";
import { cn } from "@/lib/utils";
import type { InventoryItem } from "@/lib/db/schema";

interface InventoryTableProps {
  items: InventoryItem[];
  onEdit: (item: InventoryItem) => void;
  onDelete: (item: InventoryItem) => void;
}

export function InventoryTable({
  items,
  onEdit,
  onDelete,
}: InventoryTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border/70 bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{he.inventory.table.name}</TableHead>
            <TableHead className="hidden sm:table-cell">
              {he.inventory.table.category}
            </TableHead>
            <TableHead className="text-end">
              {he.inventory.table.stock}
            </TableHead>
            <TableHead className="hidden text-end sm:table-cell">
              {he.inventory.table.unitCost}
            </TableHead>
            <TableHead className="hidden sm:table-cell">
              {he.inventory.table.expiry}
            </TableHead>
            <TableHead>{he.inventory.table.status}</TableHead>
            <TableHead className="w-12 text-end">
              <span className="sr-only">{he.common.actions}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const expiry = assessExpiry(item.expiry_date);
            const isLowStock =
              item.current_stock_units <= item.low_stock_threshold;
            const unitShort = he.units[item.unit_type].short;
            return (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Package className="h-4 w-4" />
                    </div>
                    <span className="font-medium">{item.name_he}</span>
                  </div>
                </TableCell>
                <TableCell className="hidden text-muted-foreground sm:table-cell">
                  {he.inventoryCategories[item.category]}
                </TableCell>
                <TableCell className="num text-end tabular-nums">
                  <span className={cn(isLowStock && "text-foreground")}>
                    {item.current_stock_units} {unitShort}
                  </span>
                </TableCell>
                <TableCell className="num hidden text-end tabular-nums sm:table-cell">
                  {formatPerUnit(item.cost_per_unit, unitShort)}
                </TableCell>
                <TableCell className="hidden text-sm sm:table-cell">
                  {item.expiry_date ? (
                    <ExpiryCell
                      iso={item.expiry_date}
                      daysFromToday={expiry.daysFromToday}
                      status={expiry.status}
                    />
                  ) : (
                    <span className="text-muted-foreground">
                      {he.inventory.expiry.noDate}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <StatusBadges
                    isLowStock={isLowStock}
                    expiryStatus={expiry.status}
                  />
                </TableCell>
                <TableCell className="text-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={he.common.actions}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem onClick={() => onEdit(item)}>
                        <Pencil className="h-4 w-4" />
                        {he.common.edit}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => onDelete(item)}
                      >
                        <Trash2 className="h-4 w-4" />
                        {he.common.delete}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function ExpiryCell({
  iso,
  daysFromToday,
  status,
}: {
  iso: string;
  daysFromToday: number | null;
  status: ReturnType<typeof assessExpiry>["status"];
}) {
  const date = new Date(iso);
  const formatted = Number.isNaN(date.getTime())
    ? "-"
    : format(date, "d בMMM yyyy", { locale: heLocale });

  let helper: string | null = null;
  if (daysFromToday !== null) {
    if (daysFromToday < 0) {
      helper = he.inventory.expiry.expiredDays(Math.abs(daysFromToday));
    } else if (status === "expiring_soon") {
      helper = he.inventory.expiry.daysRemaining(daysFromToday);
    }
  }

  return (
    <div className="flex flex-col gap-0.5">
      <span
        className={cn(
          "num tabular-nums",
          status === "expired" && "text-destructive",
          status === "expiring_soon" && "text-foreground",
        )}
      >
        {formatted}
      </span>
      {helper && (
        <span
          className={cn(
            "text-xs",
            status === "expired"
              ? "text-destructive"
              : "text-muted-foreground",
          )}
        >
          {helper}
        </span>
      )}
    </div>
  );
}

function StatusBadges({
  isLowStock,
  expiryStatus,
}: {
  isLowStock: boolean;
  expiryStatus: ReturnType<typeof assessExpiry>["status"];
}) {
  const badges: Array<{
    label: string;
    variant: "success" | "warning" | "destructive";
    icon?: typeof AlertTriangle;
  }> = [];

  if (expiryStatus === "expired") {
    badges.push({
      label: he.inventory.status.expired,
      variant: "destructive",
      icon: AlertTriangle,
    });
  } else if (expiryStatus === "expiring_soon") {
    badges.push({
      label: he.inventory.status.expiringSoon,
      variant: "warning",
    });
  }

  if (isLowStock) {
    badges.push({ label: he.inventory.status.lowStock, variant: "warning" });
  }

  if (badges.length === 0) {
    return <Badge variant="success">{he.inventory.status.ok}</Badge>;
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {badges.map((b) => (
        <Badge key={b.label} variant={b.variant}>
          {b.icon ? <b.icon className="me-1 h-3 w-3" /> : null}
          {b.label}
        </Badge>
      ))}
    </div>
  );
}

function formatPerUnit(value: number, unitShort: string): string {
  const formatted = new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
  return `${formatted} / ${unitShort}`;
}
