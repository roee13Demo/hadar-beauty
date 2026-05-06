"use client";

import { useMemo, useState } from "react";
import { Plus, Search, Package } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { InventoryForm } from "@/components/forms/InventoryForm";
import { InventoryTable } from "@/components/inventory/InventoryTable";
import {
  deleteInventoryItem,
  listInventoryItems,
} from "@/lib/db/inventory";
import type { InventoryItem } from "@/lib/db/schema";
import { he } from "@/lib/i18n/he";

export default function InventoryPage() {
  const items = useLiveQuery(() => listInventoryItems(), [], []);

  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<InventoryItem | null>(null);

  const filtered = useMemo(() => {
    if (!items) return [];
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) =>
        i.name_he.toLowerCase().includes(q) ||
        he.inventoryCategories[i.category].toLowerCase().includes(q),
    );
  }, [items, search]);

  const openNew = () => {
    setEditing(undefined);
    setSheetOpen(true);
  };

  const openEdit = (item: InventoryItem) => {
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
      await deleteInventoryItem(deleteTarget.id);
      toast.success(he.inventory.deleteSuccess);
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
        title={he.inventory.pageTitle}
        subtitle={he.inventory.pageSubtitle}
        actions={
          hasAny ? (
            <Button onClick={openNew}>
              <Plus className="h-4 w-4" />
              {he.inventory.addButton}
            </Button>
          ) : undefined
        }
      />

      {hasAny && (
        <div className="flex max-w-md items-center">
          <div className="relative w-full">
            <Search className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={he.inventory.searchPlaceholder}
              className="pe-10"
            />
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="rounded-xl border border-border/70 bg-card p-12 text-center text-sm text-muted-foreground">
          {he.common.loading}
        </div>
      ) : !hasAny ? (
        <EmptyState onAdd={openNew} />
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border/70 bg-card p-12 text-center text-sm text-muted-foreground">
          לא נמצאו פריטים התואמים את החיפוש
        </div>
      ) : (
        <InventoryTable
          items={filtered}
          onEdit={openEdit}
          onDelete={(i) => setDeleteTarget(i)}
        />
      )}

      <Sheet open={sheetOpen} onOpenChange={(o) => !o && closeSheet()}>
        <SheetContent side="start" className="sm:max-w-2xl">
          <SheetHeader className="pb-6">
            <SheetTitle>
              {editing ? he.inventory.formTitleEdit : he.inventory.formTitleNew}
            </SheetTitle>
            <SheetDescription>{he.inventory.formSubtitle}</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto pe-1">
            <InventoryForm
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
            <DialogTitle>{he.inventory.deleteConfirmTitle}</DialogTitle>
            <DialogDescription>
              {deleteTarget?.name_he} - {he.inventory.deleteConfirmBody}
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
        <Package className="h-7 w-7" />
      </div>
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">{he.inventory.emptyTitle}</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          {he.inventory.emptySubtitle}
        </p>
      </div>
      <Button onClick={onAdd}>
        <Plus className="h-4 w-4" />
        {he.inventory.emptyAction}
      </Button>
    </div>
  );
}
