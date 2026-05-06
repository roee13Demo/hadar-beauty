"use client";

import { useState } from "react";
import { Plus, RefreshCcw } from "lucide-react";
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
import { RecurringExpenseForm } from "@/components/forms/RecurringExpenseForm";
import { RecurringExpenseTable } from "@/components/recurring/RecurringExpenseTable";
import {
  deleteRecurringExpense,
  listRecurringExpenses,
} from "@/lib/db/recurring";
import type { RecurringExpense } from "@/lib/db/schema";
import { he } from "@/lib/i18n/he";

export default function RecurringPage() {
  const items = useLiveQuery(() => listRecurringExpenses(), [], []);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<RecurringExpense | undefined>(
    undefined,
  );
  const [deleteTarget, setDeleteTarget] = useState<RecurringExpense | null>(
    null,
  );

  const openNew = () => {
    setEditing(undefined);
    setSheetOpen(true);
  };

  const openEdit = (item: RecurringExpense) => {
    setEditing(item);
    setSheetOpen(true);
  };

  const closeSheet = () => {
    setSheetOpen(false);
    setEditing(undefined);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteRecurringExpense(deleteTarget.id);
      toast.success(he.recurring.deleteSuccess);
      setDeleteTarget(null);
    } catch {
      toast.error(he.errors.generic);
    }
  };

  const isLoading = items === undefined;
  const hasAny = !isLoading && items!.length > 0;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={he.recurring.pageTitle}
        subtitle={he.recurring.pageSubtitle}
        actions={
          hasAny ? (
            <Button onClick={openNew}>
              <Plus className="h-4 w-4" />
              {he.recurring.addButton}
            </Button>
          ) : undefined
        }
      />

      {isLoading ? (
        <div className="rounded-xl border border-border/70 bg-card p-12 text-center text-sm text-muted-foreground">
          {he.common.loading}
        </div>
      ) : !hasAny ? (
        <EmptyState onAdd={openNew} />
      ) : (
        <RecurringExpenseTable
          items={items!}
          onEdit={openEdit}
          onDelete={(i) => setDeleteTarget(i)}
        />
      )}

      <Sheet open={sheetOpen} onOpenChange={(o) => !o && closeSheet()}>
        <SheetContent side="start" className="sm:max-w-2xl">
          <SheetHeader className="pb-6">
            <SheetTitle>
              {editing
                ? he.recurring.formTitleEdit
                : he.recurring.formTitleNew}
            </SheetTitle>
            <SheetDescription>{he.recurring.formSubtitle}</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto pe-1">
            <RecurringExpenseForm
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
            <DialogTitle>{he.recurring.deleteConfirmTitle}</DialogTitle>
            <DialogDescription>
              {deleteTarget?.name_he} - {he.recurring.deleteConfirmBody}
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
        <RefreshCcw className="h-7 w-7" />
      </div>
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">{he.recurring.emptyTitle}</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          {he.recurring.emptySubtitle}
        </p>
      </div>
      <Button onClick={onAdd}>
        <Plus className="h-4 w-4" />
        {he.recurring.emptyAction}
      </Button>
    </div>
  );
}
