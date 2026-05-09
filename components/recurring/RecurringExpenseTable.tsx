"use client";

import { MoreHorizontal, Pencil, Trash2, RefreshCcw } from "lucide-react";
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
import { formatILS } from "@/lib/utils";
import { he } from "@/lib/i18n/he";
import { isPending, monthKey } from "@/lib/db/recurring";
import type { RecurringExpense } from "@/lib/db/schema";

interface RecurringExpenseTableProps {
  items: RecurringExpense[];
  onEdit: (item: RecurringExpense) => void;
  onDelete: (item: RecurringExpense) => void;
}

export function RecurringExpenseTable({
  items,
  onEdit,
  onDelete,
}: RecurringExpenseTableProps) {
  const today = new Date();
  const currentMonth = monthKey(today);

  return (
    <div className="overflow-x-auto rounded-xl border border-border/70 bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{he.recurring.table.name}</TableHead>
            <TableHead className="text-end">
              {he.recurring.table.amount}
            </TableHead>
            <TableHead className="hidden sm:table-cell">
              {he.recurring.table.category}
            </TableHead>
            <TableHead className="hidden text-end sm:table-cell">
              {he.recurring.table.day}
            </TableHead>
            <TableHead className="hidden sm:table-cell">
              {he.recurring.table.lastPosted}
            </TableHead>
            <TableHead>{he.recurring.table.status}</TableHead>
            <TableHead className="w-12 text-end">
              <span className="sr-only">{he.common.actions}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const pending = isPending(item, today);
            const lastPostedLabel = item.last_posted_month
              ? he.recurring.table.monthLabel(item.last_posted_month)
              : he.recurring.table.neverPosted;
            const isThisMonth = item.last_posted_month === currentMonth;

            return (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <RefreshCcw className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium">{item.name_he}</span>
                      {item.notes_he && (
                        <span className="text-xs text-muted-foreground">
                          {item.notes_he}
                        </span>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="num text-end tabular-nums">
                  {formatILS(item.amount_ils)}
                </TableCell>
                <TableCell className="hidden text-muted-foreground sm:table-cell">
                  {item.expense_category}
                </TableCell>
                <TableCell className="num hidden text-end tabular-nums text-muted-foreground sm:table-cell">
                  {item.day_of_month}
                </TableCell>
                <TableCell className="hidden text-xs text-muted-foreground sm:table-cell">
                  {lastPostedLabel}
                </TableCell>
                <TableCell>
                  {!item.is_active ? (
                    <Badge variant="secondary">
                      {he.recurring.status.inactive}
                    </Badge>
                  ) : pending ? (
                    <Badge variant="warning">
                      {he.recurring.status.pending}
                    </Badge>
                  ) : isThisMonth ? (
                    <Badge variant="success">{he.recurring.status.active}</Badge>
                  ) : (
                    <Badge variant="success">{he.recurring.status.active}</Badge>
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
