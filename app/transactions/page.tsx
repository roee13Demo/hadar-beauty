"use client";

import { useMemo, useState } from "react";
import { Plus, Receipt } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TransactionForm } from "@/components/forms/TransactionForm";
import { TransactionTable } from "@/components/transactions/TransactionTable";
import { DailySummary } from "@/components/transactions/DailySummary";
import {
  deleteTransaction,
  listTransactions,
  summarizeDay,
  todayIso,
} from "@/lib/db/transactions";
import { listServices } from "@/lib/db/services";
import type { Transaction } from "@/lib/db/schema";
import { he } from "@/lib/i18n/he";

export default function TransactionsPage() {
  const transactions = useLiveQuery(() => listTransactions(), [], []);
  const services = useLiveQuery(() => listServices(), [], []);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);

  const servicesById = useMemo(() => {
    const map = new Map();
    for (const s of services ?? []) map.set(s.id, s);
    return map;
  }, [services]);

  const todayTotals = useMemo(
    () => summarizeDay(transactions ?? [], todayIso()),
    [transactions],
  );

  const openNew = () => {
    setEditing(undefined);
    setSheetOpen(true);
  };

  const openEdit = (t: Transaction) => {
    setEditing(t);
    setSheetOpen(true);
  };

  const closeSheet = () => {
    setSheetOpen(false);
    setEditing(undefined);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteTransaction(deleteTarget.id);
      toast.success(he.transactions.deleteSuccess);
      setDeleteTarget(null);
    } catch {
      toast.error(he.errors.generic);
    }
  };

  const isLoading = transactions === undefined;
  const hasAny = !isLoading && transactions!.length > 0;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={he.transactions.pageTitle}
        subtitle={he.transactions.pageSubtitle}
        actions={
          <Button onClick={openNew}>
            <Plus className="h-4 w-4" />
            {he.transactions.addButton}
          </Button>
        }
      />

      <DailySummary totals={todayTotals} />

      {isLoading ? (
        <div className="rounded-xl border border-border/70 bg-card p-12 text-center text-sm text-muted-foreground">
          {he.common.loading}
        </div>
      ) : !hasAny ? (
        <EmptyState onAdd={openNew} />
      ) : (
        <TransactionTable
          transactions={transactions!}
          servicesById={servicesById}
          onEdit={openEdit}
          onDelete={(t) => setDeleteTarget(t)}
        />
      )}

      <Sheet open={sheetOpen} onOpenChange={(o) => !o && closeSheet()}>
        <SheetContent side="start" className="sm:max-w-2xl">
          <SheetHeader className="pb-6">
            <SheetTitle>
              {editing
                ? he.transactions.formTitleEdit
                : he.transactions.formTitleNew}
            </SheetTitle>
            <SheetDescription>
              {he.transactions.formSubtitle}
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto pe-1">
            <TransactionForm
              key={editing?.id ?? "new"}
              initial={editing}
              onSaved={closeSheet}
              onCancel={closeSheet}
            />
          </div>
        </SheetContent>
      </Sheet>

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{he.transactions.deleteConfirmTitle}</DialogTitle>
            <DialogDescription>
              {he.transactions.deleteConfirmBody}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              {he.common.cancel}
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              {he.common.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 rounded-xl border border-dashed border-border/80 bg-card/40 px-6 py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Receipt className="h-7 w-7" />
      </div>
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">
          {he.transactions.emptyTitle}
        </h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          {he.transactions.emptySubtitle}
        </p>
      </div>
      <Button onClick={onAdd}>
        <Plus className="h-4 w-4" />
        {he.transactions.emptyAction}
      </Button>
    </div>
  );
}
