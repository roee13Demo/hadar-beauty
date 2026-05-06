"use client";

import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UnitCostPreview } from "@/components/inventory/UnitCostPreview";
import { ServiceLinkagePanel } from "@/components/inventory/ServiceLinkagePanel";
import {
  inventoryFormSchema,
  type InventoryFormValues,
  INVENTORY_FORM_DEFAULTS,
  INVENTORY_CATEGORIES,
  INVENTORY_UNITS,
} from "@/lib/schemas/inventory-form";
import {
  createInventoryItem,
  isInventoryNameUnique,
  updateInventoryItem,
} from "@/lib/db/inventory";
import type { InventoryItem } from "@/lib/db/schema";
import { he } from "@/lib/i18n/he";
import { cn } from "@/lib/utils";

interface InventoryFormProps {
  initial?: InventoryItem;
  onSaved: () => void;
  onCancel: () => void;
}

function initialValues(initial?: InventoryItem): InventoryFormValues {
  if (!initial) return INVENTORY_FORM_DEFAULTS;
  return {
    name_he: initial.name_he,
    category: initial.category,
    unit_type: initial.unit_type,
    bulk_cost_ils: initial.bulk_cost_ils,
    bulk_quantity: initial.bulk_quantity,
    current_stock_units: initial.current_stock_units,
    low_stock_threshold: initial.low_stock_threshold,
    expiry_date: initial.expiry_date,
    notes_he: initial.notes_he,
  };
}

export function InventoryForm({
  initial,
  onSaved,
  onCancel,
}: InventoryFormProps) {
  const [isPending, startTransition] = useTransition();
  const isEditing = Boolean(initial);

  const form = useForm<InventoryFormValues>({
    resolver: zodResolver(inventoryFormSchema),
    defaultValues: initialValues(initial),
    mode: "onBlur",
  });

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    watch,
    formState: { errors },
  } = form;

  const watchedCategory = watch("category");
  const watchedUnitType = watch("unit_type");
  const watchedBulkCost = watch("bulk_cost_ils");
  const watchedBulkQty = watch("bulk_quantity");
  const watchedStock = watch("current_stock_units");
  const watchedExpiry = watch("expiry_date");

  useEffect(() => {
    if (!initial) return;
    form.reset(initialValues(initial));
  }, [initial, form]);

  const unitShort = watchedUnitType
    ? he.units[watchedUnitType].short
    : undefined;

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const unique = await isInventoryNameUnique(values.name_he, initial?.id);
      if (!unique) {
        setError("name_he", {
          type: "manual",
          message: he.inventory.validation.nameUnique,
        });
        return;
      }
      try {
        if (initial) {
          await updateInventoryItem(initial.id, values);
        } else {
          await createInventoryItem(values);
        }
        toast.success(he.inventory.saveSuccess);
        onSaved();
      } catch {
        toast.error(he.errors.generic);
      }
    });
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-1 flex-col gap-6">
      <div className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-5">
          <FormField
            label={he.inventory.fields.name}
            error={errors.name_he?.message}
            htmlFor="name_he"
          >
            <Input
              id="name_he"
              autoFocus
              placeholder={he.inventory.fields.namePlaceholder}
              autoComplete="off"
              {...register("name_he")}
            />
          </FormField>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <FormField
              label={he.inventory.fields.category}
              error={errors.category?.message}
              htmlFor="category"
            >
              <Select
                dir="rtl"
                value={watchedCategory}
                onValueChange={(v) =>
                  setValue("category", v as InventoryFormValues["category"], {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger id="category">
                  <SelectValue
                    placeholder={he.inventory.fields.categoryPlaceholder}
                  />
                </SelectTrigger>
                <SelectContent>
                  {INVENTORY_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {he.inventoryCategories[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField
              label={he.inventory.fields.unitType}
              error={errors.unit_type?.message}
              htmlFor="unit_type"
            >
              <Select
                dir="rtl"
                value={watchedUnitType}
                onValueChange={(v) =>
                  setValue("unit_type", v as InventoryFormValues["unit_type"], {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger id="unit_type">
                  <SelectValue
                    placeholder={he.inventory.fields.unitTypePlaceholder}
                  />
                </SelectTrigger>
                <SelectContent>
                  {INVENTORY_UNITS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {he.units[u].long}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <FormField
              label={he.inventory.fields.bulkCost}
              error={errors.bulk_cost_ils?.message}
              htmlFor="bulk_cost_ils"
            >
              <Input
                id="bulk_cost_ils"
                type="number"
                inputMode="decimal"
                step="0.5"
                min={0}
                placeholder="0"
                suffix="₪"
                {...register("bulk_cost_ils", { valueAsNumber: true })}
              />
            </FormField>

            <FormField
              label={he.inventory.fields.bulkQuantity}
              error={errors.bulk_quantity?.message}
              htmlFor="bulk_quantity"
            >
              <Input
                id="bulk_quantity"
                type="number"
                inputMode="decimal"
                step="0.5"
                min={0}
                placeholder="0"
                suffix={unitShort}
                {...register("bulk_quantity", { valueAsNumber: true })}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <FormField
              label={he.inventory.fields.currentStock}
              error={errors.current_stock_units?.message}
              htmlFor="current_stock_units"
            >
              <Input
                id="current_stock_units"
                type="number"
                inputMode="decimal"
                step="0.5"
                min={0}
                placeholder="0"
                suffix={unitShort}
                {...register("current_stock_units", { valueAsNumber: true })}
              />
            </FormField>

            <FormField
              label={he.inventory.fields.lowStockThreshold}
              error={errors.low_stock_threshold?.message}
              htmlFor="low_stock_threshold"
            >
              <Input
                id="low_stock_threshold"
                type="number"
                inputMode="decimal"
                step="0.5"
                min={0}
                placeholder="0"
                suffix={unitShort}
                {...register("low_stock_threshold", { valueAsNumber: true })}
              />
            </FormField>
          </div>

          <FormField
            label={he.inventory.fields.expiryDate}
            error={errors.expiry_date?.message}
            htmlFor="expiry_date"
            help={he.inventory.fields.expiryHelp}
          >
            <Input
              id="expiry_date"
              type="date"
              value={watchedExpiry ?? ""}
              onChange={(e) =>
                setValue("expiry_date", e.target.value || null, {
                  shouldValidate: true,
                })
              }
            />
          </FormField>

          <FormField
            label={he.inventory.fields.notes}
            error={errors.notes_he?.message}
            htmlFor="notes_he"
          >
            <Textarea
              id="notes_he"
              placeholder={he.inventory.fields.notesPlaceholder}
              {...register("notes_he")}
            />
          </FormField>
        </div>

        <div className="lg:sticky lg:top-0 lg:self-start">
          <UnitCostPreview
            bulkCost={watchedBulkCost}
            bulkQuantity={watchedBulkQty}
            currentStock={watchedStock}
            unitType={watchedUnitType ?? null}
          />
        </div>
      </div>

      {initial && <ServiceLinkagePanel item={initial} />}

      <div className="flex flex-row-reverse items-center gap-2 border-t border-border/60 pt-4">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? he.common.saving
            : isEditing
              ? he.common.save
              : "שמירת פריט"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          {he.common.cancel}
        </Button>
      </div>
    </form>
  );
}

interface FormFieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  help?: string;
  children: React.ReactNode;
}

function FormField({ label, htmlFor, error, help, children }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {help && !error && (
        <span className="text-xs text-muted-foreground">{help}</span>
      )}
      {error && (
        <span
          className={cn("text-xs text-destructive", "animate-fade-in")}
          role="alert"
        >
          {error}
        </span>
      )}
    </div>
  );
}
