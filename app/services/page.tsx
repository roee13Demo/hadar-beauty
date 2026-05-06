"use client";

import { useMemo, useState } from "react";
import { Plus, Search, Sparkles } from "lucide-react";
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
import { ServiceForm } from "@/components/forms/ServiceForm";
import { ServiceTable } from "@/components/services/ServiceTable";
import { deleteService, listServices } from "@/lib/db/services";
import type { Service } from "@/lib/db/schema";
import { he } from "@/lib/i18n/he";

export default function ServicesPage() {
  const services = useLiveQuery(() => listServices(), [], []);

  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Service | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);

  const filtered = useMemo(() => {
    if (!services) return [];
    const q = search.trim().toLowerCase();
    if (!q) return services;
    return services.filter(
      (s) =>
        s.name_he.toLowerCase().includes(q) ||
        he.categories[s.category].toLowerCase().includes(q),
    );
  }, [services, search]);

  const openNew = () => {
    setEditing(undefined);
    setSheetOpen(true);
  };

  const openEdit = (service: Service) => {
    setEditing(service);
    setSheetOpen(true);
  };

  const closeSheet = () => {
    setSheetOpen(false);
    setEditing(undefined);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteService(deleteTarget.id);
      toast.success(he.services.deleteSuccess);
      setDeleteTarget(null);
    } catch {
      toast.error(he.errors.generic);
    }
  };

  const isLoading = services === undefined;
  const hasAny = !isLoading && services!.length > 0;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={he.services.pageTitle}
        subtitle={he.services.pageSubtitle}
        actions={
          hasAny ? (
            <Button onClick={openNew}>
              <Plus className="h-4 w-4" />
              {he.services.addButton}
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
              placeholder={he.services.searchPlaceholder}
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
          לא נמצאו טיפולים התואמים את החיפוש
        </div>
      ) : (
        <ServiceTable
          services={filtered}
          onEdit={openEdit}
          onDelete={(s) => setDeleteTarget(s)}
        />
      )}

      <Sheet open={sheetOpen} onOpenChange={(o) => !o && closeSheet()}>
        <SheetContent side="start" className="sm:max-w-2xl">
          <SheetHeader className="pb-6">
            <SheetTitle>
              {editing ? he.services.formTitleEdit : he.services.formTitleNew}
            </SheetTitle>
            <SheetDescription>{he.services.formSubtitle}</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto pe-1">
            <ServiceForm
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
            <DialogTitle>{he.services.deleteConfirmTitle}</DialogTitle>
            <DialogDescription>
              {deleteTarget?.name_he} - {he.services.deleteConfirmBody}
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
        <Sparkles className="h-7 w-7" />
      </div>
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">{he.services.emptyTitle}</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          {he.services.emptySubtitle}
        </p>
      </div>
      <Button onClick={onAdd}>
        <Plus className="h-4 w-4" />
        {he.services.emptyAction}
      </Button>
    </div>
  );
}
