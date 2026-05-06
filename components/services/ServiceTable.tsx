"use client";

import { MoreHorizontal, Pencil, Trash2, Sparkles } from "lucide-react";
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
import { computeMargin, ISRAELI_VAT_RATE } from "@/lib/calculations/margin";
import { formatILS } from "@/lib/utils";
import { he } from "@/lib/i18n/he";
import { findColorAddon } from "@/lib/db/services";
import type { Service } from "@/lib/db/schema";

interface ServiceTableProps {
  services: Service[];
  onEdit: (service: Service) => void;
  onDelete: (service: Service) => void;
}

export function ServiceTable({
  services,
  onEdit,
  onDelete,
}: ServiceTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border/70 bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{he.services.table.name}</TableHead>
            <TableHead className="text-end">
              {he.services.table.price}
            </TableHead>
            <TableHead className="text-end">
              {he.services.table.netProfit}
            </TableHead>
            <TableHead className="text-end">
              {he.services.table.duration}
            </TableHead>
            <TableHead>{he.services.table.status}</TableHead>
            <TableHead className="w-12 text-end">
              <span className="sr-only">{he.common.actions}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {services.map((service) => {
            const colorAddOn = findColorAddon(service);
            const effectivePrice =
              service.price_ils + (colorAddOn?.price_delta_ils ?? 0);
            const margin = computeMargin({
              price: effectivePrice,
              materialCost: service.estimated_material_cost,
              taxRate: ISRAELI_VAT_RATE,
            });
            return (
              <TableRow key={service.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium">{service.name_he}</span>
                      <span className="text-xs text-muted-foreground">
                        {he.categories[service.category]}
                        {colorAddOn
                          ? ` · ${he.addOns.badgeColor(colorAddOn.price_delta_ils)}`
                          : ""}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="num text-end tabular-nums">
                  <div className="flex flex-col items-end">
                    <span>{formatILS(effectivePrice)}</span>
                    {colorAddOn && (
                      <span className="text-xs text-muted-foreground">
                        בסיס {formatILS(service.price_ils)}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="num text-end tabular-nums">
                  <span
                    className={
                      margin.netProfit <= 0
                        ? "text-destructive"
                        : margin.isHealthy
                          ? "text-success"
                          : "text-foreground"
                    }
                  >
                    {formatILS(margin.netProfit)}
                  </span>
                </TableCell>
                <TableCell className="num text-end tabular-nums text-muted-foreground">
                  {service.duration_minutes} {he.services.fields.durationSuffix}
                </TableCell>
                <TableCell>
                  {service.is_active ? (
                    <Badge variant="success">{he.services.table.active}</Badge>
                  ) : (
                    <Badge variant="secondary">
                      {he.services.table.inactive}
                    </Badge>
                  )}
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
                      <DropdownMenuItem onClick={() => onEdit(service)}>
                        <Pencil className="h-4 w-4" />
                        {he.common.edit}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => onDelete(service)}
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
