"use client";

import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Link2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listServices } from "@/lib/db/services";
import {
  listLinksForInventoryItem,
  upsertServiceMaterial,
  deleteServiceMaterial,
  findExistingLink,
} from "@/lib/db/service-materials";
import { computeCogsContribution } from "@/lib/calculations/unit-cost";
import { formatILS } from "@/lib/utils";
import { he } from "@/lib/i18n/he";
import type { InventoryItem } from "@/lib/db/schema";

interface ServiceLinkagePanelProps {
  /** The inventory item the panel is linking. Null if it has not been saved yet. */
  item: InventoryItem | null;
}

export function ServiceLinkagePanel({ item }: ServiceLinkagePanelProps) {
  const services = useLiveQuery(() => listServices(), [], []);
  const links = useLiveQuery(
    () => (item ? listLinksForInventoryItem(item.id) : Promise.resolve([])),
    [item?.id],
    [],
  );

  const [draftServiceId, setDraftServiceId] = useState<string>("");
  const [draftUnits, setDraftUnits] = useState<string>("");
  const [showDraft, setShowDraft] = useState(false);

  const activeServices = useMemo(
    () => (services ?? []).filter((s) => s.is_active),
    [services],
  );

  const linkedServiceIds = useMemo(
    () => new Set((links ?? []).map((l) => l.service_id)),
    [links],
  );

  const availableServices = useMemo(
    () => activeServices.filter((s) => !linkedServiceIds.has(s.id)),
    [activeServices, linkedServiceIds],
  );

  if (!item) {
    return (
      <PanelShell>
        <p className="text-sm text-muted-foreground">
          {he.inventory.linkage.saveBeforeLinking}
        </p>
      </PanelShell>
    );
  }

  if (activeServices.length === 0) {
    return (
      <PanelShell>
        <p className="text-sm text-muted-foreground">
          {he.inventory.linkage.noServicesAvailable}
        </p>
      </PanelShell>
    );
  }

  const unitShort = he.units[item.unit_type].short;

  const handleAddDraft = async () => {
    if (!draftServiceId) return;
    const consumed = Number(draftUnits);
    if (!Number.isFinite(consumed) || consumed <= 0) {
      toast.error(he.inventory.validation.consumedPositive);
      return;
    }

    const existing = await findExistingLink(draftServiceId, item.id);
    if (existing) {
      toast.error(he.inventory.validation.duplicateLink);
      return;
    }

    try {
      await upsertServiceMaterial({
        service_id: draftServiceId,
        inventory_item_id: item.id,
        units_consumed_per_service: consumed,
      });
      toast.success(he.inventory.linkage.addLinkSuccess);
      setDraftServiceId("");
      setDraftUnits("");
      setShowDraft(false);
    } catch {
      toast.error(he.errors.generic);
    }
  };

  const handleUpdateUnits = async (linkId: string, value: string) => {
    const consumed = Number(value);
    if (!Number.isFinite(consumed) || consumed <= 0) return;
    try {
      await upsertServiceMaterial({
        service_id: (links ?? []).find((l) => l.id === linkId)!.service_id,
        inventory_item_id: item.id,
        units_consumed_per_service: consumed,
      });
    } catch {
      toast.error(he.errors.generic);
    }
  };

  const handleRemove = async (linkId: string) => {
    try {
      await deleteServiceMaterial(linkId);
      toast.success(he.inventory.linkage.removeLinkSuccess);
    } catch {
      toast.error(he.errors.generic);
    }
  };

  return (
    <PanelShell>
      <p className="mb-3 text-xs text-muted-foreground">
        {he.inventory.linkage.help}
      </p>

      <div className="flex flex-col gap-2">
        {(links ?? []).map((link) => {
          const service = activeServices.find((s) => s.id === link.service_id);
          if (!service) return null;
          const cogs = computeCogsContribution({
            unitsConsumedPerService: link.units_consumed_per_service,
            costPerUnit: item.cost_per_unit,
          });
          return (
            <div
              key={link.id}
              className="flex flex-col gap-3 rounded-lg border border-border/70 bg-card p-3 sm:flex-row sm:items-center sm:gap-4"
            >
              <div className="flex flex-1 items-center gap-2">
                <Link2 className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{service.name_he}</span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  inputMode="decimal"
                  step="0.5"
                  min={0}
                  defaultValue={link.units_consumed_per_service}
                  onBlur={(e) => handleUpdateUnits(link.id, e.target.value)}
                  className="w-24"
                  suffix={unitShort}
                  aria-label={he.inventory.linkage.consumedLabel}
                />
                <span className="num min-w-20 text-end text-sm tabular-nums text-success">
                  {formatILSDecimal(cogs)}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={he.inventory.linkage.removeLink}
                  onClick={() => handleRemove(link.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          );
        })}

        {(links ?? []).length === 0 && !showDraft && (
          <p className="rounded-lg border border-dashed border-border/70 bg-card/50 p-3 text-center text-sm text-muted-foreground">
            {he.inventory.linkage.empty}
          </p>
        )}

        {showDraft && availableServices.length > 0 && (
          <div className="flex flex-col gap-3 rounded-lg border border-border/70 bg-secondary/30 p-3 sm:flex-row sm:items-center sm:gap-3">
            <div className="flex-1">
              <Select
                dir="rtl"
                value={draftServiceId}
                onValueChange={setDraftServiceId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={he.inventory.linkage.pickService} />
                </SelectTrigger>
                <SelectContent>
                  {availableServices.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name_he}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                inputMode="decimal"
                step="0.5"
                min={0}
                value={draftUnits}
                onChange={(e) => setDraftUnits(e.target.value)}
                placeholder="0"
                className="w-24"
                suffix={unitShort}
                aria-label={he.inventory.linkage.consumedLabel}
              />
              <Button type="button" onClick={handleAddDraft} size="sm">
                {he.common.save}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowDraft(false);
                  setDraftServiceId("");
                  setDraftUnits("");
                }}
              >
                {he.common.cancel}
              </Button>
            </div>
          </div>
        )}

        {availableServices.length > 0 && !showDraft && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowDraft(true)}
            className="self-start"
          >
            <Plus className="h-4 w-4" />
            {(links ?? []).length === 0
              ? he.inventory.linkage.addButton
              : he.inventory.linkage.addAnother}
          </Button>
        )}
      </div>
    </PanelShell>
  );
}

function PanelShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border/70 bg-card p-5">
      <div className="mb-2 flex items-center gap-2">
        <Link2 className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold tracking-tight">
          {he.inventory.linkage.title}
        </h3>
      </div>
      {children}
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
