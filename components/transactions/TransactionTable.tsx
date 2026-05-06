"use client";

import {
  MoreHorizontal,
  Pencil,
  Trash2,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
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
import { formatILS, cn } from "@/lib/utils";
import { he } from "@/lib/i18n/he";
import type { Service, Transaction } from "@/lib/db/schema";

interface TransactionTableProps {
  transactions: Transaction[];
  servicesById: Map<string, Service>;
  onEdit: (t: Transaction) => void;
  onDelete: (t: Transaction) => void;
}

export function TransactionTable({
  transactions,
  servicesById,
  onEdit,
  onDelete,
}: TransactionTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border/70 bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{he.transactions.table.date}</TableHead>
            <TableHead>{he.transactions.table.type}</TableHead>
            <TableHead>{he.transactions.table.description}</TableHead>
            <TableHead className="text-end">
              {he.transactions.table.gross}
            </TableHead>
            <TableHead className="text-end">
              {he.transactions.table.net}
            </TableHead>
            <TableHead>{he.transactions.table.paymentMethod}</TableHead>
            <TableHead className="w-12 text-end">
              <span className="sr-only">{he.common.actions}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((t) => {
            const service = t.service_id
              ? servicesById.get(t.service_id)
              : null;
            const description =
              t.type === "income"
                ? service
                  ? he.categories[service.category]
                  : "טיפול"
                : t.expense_category ?? "הוצאה";
            const date = new Date(t.date);
            const dateLabel = Number.isNaN(date.getTime())
              ? t.date
              : format(date, "d בMMM", { locale: heLocale });
            return (
              <TableRow key={t.id}>
                <TableCell className="num text-sm tabular-nums text-muted-foreground">
                  {dateLabel}
                </TableCell>
                <TableCell>
                  {t.type === "income" ? (
                    <Badge variant="success">
                      <TrendingUp className="me-1 h-3 w-3" />
                      {he.transactions.typeIncome}
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <TrendingDown className="me-1 h-3 w-3" />
                      {he.transactions.typeExpense}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium">{description}</span>
                    {t.notes_he && (
                      <span className="text-xs text-muted-foreground">
                        {t.notes_he}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="num text-end tabular-nums">
                  {t.type === "income"
                    ? formatILS(t.amount_gross)
                    : `-${formatILS(t.amount_gross)}`}
                </TableCell>
                <TableCell className="num text-end tabular-nums">
                  <span
                    className={cn(
                      t.type === "income"
                        ? t.net_profit > 0
                          ? "text-success"
                          : "text-destructive"
                        : "text-destructive",
                    )}
                  >
                    {t.type === "income"
                      ? formatILS(t.net_profit)
                      : `-${formatILS(t.amount_gross)}`}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {he.paymentMethods[t.payment_method]}
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
                      <DropdownMenuItem onClick={() => onEdit(t)}>
                        <Pencil className="h-4 w-4" />
                        {he.common.edit}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => onDelete(t)}
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
