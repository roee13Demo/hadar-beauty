"use client";

import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MarginPreview } from "@/components/services/MarginPreview";
import {
  serviceFormSchema,
  type ServiceFormValues,
  SERVICE_FORM_DEFAULTS,
  SERVICE_CATEGORIES,
} from "@/lib/schemas/service-form";
import {
  createService,
  isServiceNameUnique,
  updateService,
  findColorAddon,
} from "@/lib/db/services";
import {
  COLOR_ADDON_DEFAULT_PRICE,
  COLOR_ADDON_NAME,
  type Service,
  type ServiceAddOn,
} from "@/lib/db/schema";
import { he } from "@/lib/i18n/he";
import { cn } from "@/lib/utils";

interface ServiceFormProps {
  initial?: Service;
  onSaved: () => void;
  onCancel: () => void;
}

function initialValues(initial?: Service): ServiceFormValues {
  if (!initial) return SERVICE_FORM_DEFAULTS;
  const colorAddon = findColorAddon(initial);
  return {
    name_he: initial.name_he,
    category: initial.category,
    price_ils: initial.price_ils,
    estimated_material_cost: initial.estimated_material_cost,
    duration_minutes: initial.duration_minutes,
    is_active: initial.is_active,
    has_color_addon: Boolean(colorAddon),
    color_addon_price: colorAddon?.price_delta_ils ?? COLOR_ADDON_DEFAULT_PRICE,
  };
}

function buildAddOns(values: ServiceFormValues): ServiceAddOn[] {
  if (values.category === "brows" && values.has_color_addon) {
    return [
      {
        name_he: COLOR_ADDON_NAME,
        price_delta_ils: values.color_addon_price,
      },
    ];
  }
  return [];
}

export function ServiceForm({ initial, onSaved, onCancel }: ServiceFormProps) {
  const [isPending, startTransition] = useTransition();
  const isEditing = Boolean(initial);

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
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

  const watchedPrice = watch("price_ils");
  const watchedMaterial = watch("estimated_material_cost");
  const watchedCategory = watch("category");
  const watchedName = watch("name_he");
  const watchedActive = watch("is_active");
  const watchedHasColorAddon = watch("has_color_addon");
  const watchedColorPrice = watch("color_addon_price");

  useEffect(() => {
    if (!initial) return;
    form.reset(initialValues(initial));
  }, [initial, form]);

  // When category changes on a new service, auto-fill name with category label
  // only if the user hasn't typed anything custom yet.
  useEffect(() => {
    if (isEditing) return;
    const current = (watchedName ?? "").trim();
    const anyLabel = Object.values(he.categories) as string[];
    const isDefaultLabel = anyLabel.includes(current) || current === "";
    if (isDefaultLabel) {
      setValue("name_he", he.categories[watchedCategory] as string, {
        shouldValidate: false,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedCategory]);

  // Reset colour add-on when switching away from brows
  useEffect(() => {
    if (watchedCategory !== "brows" && watchedHasColorAddon) {
      setValue("has_color_addon", false, { shouldValidate: false });
    }
  }, [watchedCategory, watchedHasColorAddon, setValue]);

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const unique = await isServiceNameUnique(values.name_he, initial?.id);
      if (!unique) {
        setError("name_he", {
          type: "manual",
          message: he.services.validation.nameUnique,
        });
        return;
      }
      const payload = {
        name_he: values.name_he.trim(),
        category: values.category,
        price_ils: values.price_ils,
        estimated_material_cost: values.estimated_material_cost,
        duration_minutes: values.duration_minutes,
        is_active: values.is_active,
        add_ons: buildAddOns(values),
      };
      try {
        if (initial) {
          await updateService(initial.id, payload);
        } else {
          await createService(payload);
        }
        toast.success(he.services.saveSuccess);
        onSaved();
      } catch {
        toast.error(he.errors.generic);
      }
    });
  });

  const colorAddOn =
    watchedCategory === "brows" && watchedHasColorAddon
      ? Number.isFinite(watchedColorPrice)
        ? watchedColorPrice
        : 0
      : undefined;

  return (
    <form onSubmit={onSubmit} className="flex flex-1 flex-col gap-6">
      <div className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-5">
          {/* Name */}
          <FormField
            label={he.services.fields.name}
            error={errors.name_he?.message}
            htmlFor="name_he"
          >
            <Input
              id="name_he"
              autoFocus
              type="text"
              placeholder={he.services.fields.namePlaceholder}
              {...register("name_he")}
            />
          </FormField>

          {/* Category */}
          <FormField
            label={he.services.fields.category}
            error={errors.category?.message}
            htmlFor="category"
          >
            <Select
              dir="rtl"
              value={watchedCategory}
              onValueChange={(v) =>
                setValue("category", v as ServiceFormValues["category"], {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger id="category">
                <SelectValue placeholder={he.services.fields.categoryPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                {SERVICE_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {he.categories[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          {/* Price + Material cost */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <FormField
              label={he.services.fields.price}
              error={errors.price_ils?.message}
              htmlFor="price_ils"
            >
              <Input
                id="price_ils"
                type="number"
                inputMode="decimal"
                step="1"
                min={0}
                placeholder="0"
                suffix="₪"
                {...register("price_ils", { valueAsNumber: true })}
              />
            </FormField>

            <FormField
              label={he.services.fields.materialCost}
              error={errors.estimated_material_cost?.message}
              htmlFor="estimated_material_cost"
            >
              <Input
                id="estimated_material_cost"
                type="number"
                inputMode="decimal"
                step="0.5"
                min={0}
                placeholder="0"
                suffix="₪"
                {...register("estimated_material_cost", { valueAsNumber: true })}
              />
            </FormField>
          </div>

          {/* Duration */}
          <FormField
            label={he.services.fields.duration}
            error={errors.duration_minutes?.message}
            htmlFor="duration_minutes"
          >
            <Input
              id="duration_minutes"
              type="number"
              inputMode="numeric"
              step="5"
              min={5}
              max={480}
              placeholder="60"
              suffix={he.services.fields.durationSuffix}
              {...register("duration_minutes", { valueAsNumber: true })}
            />
          </FormField>

          {/* Colour add-on (brows only) */}
          {watchedCategory === "brows" && (
            <ColorAddOnPanel
              enabled={watchedHasColorAddon}
              onToggle={(checked) =>
                setValue("has_color_addon", checked, { shouldValidate: true })
              }
              priceInputProps={register("color_addon_price", {
                valueAsNumber: true,
              })}
              priceError={errors.color_addon_price?.message}
            />
          )}

          {/* Active toggle */}
          <div className="flex items-center justify-between rounded-lg border border-border/70 bg-secondary/30 p-4">
            <div className="flex flex-col gap-0.5">
              <Label htmlFor="is_active" className="cursor-pointer">
                {he.services.fields.status}
              </Label>
              <span className="text-xs text-muted-foreground">
                טיפולים כבויים לא יופיעו ברשימת הבחירה ברישום עסקאות
              </span>
            </div>
            <Switch
              id="is_active"
              checked={watchedActive}
              onCheckedChange={(checked) =>
                setValue("is_active", checked, { shouldValidate: false })
              }
            />
          </div>
        </div>

        {/* Margin preview */}
        <div className="lg:sticky lg:top-0 lg:self-start">
          <MarginPreview
            price={Number.isFinite(watchedPrice) ? watchedPrice : 0}
            materialCost={
              Number.isFinite(watchedMaterial) ? watchedMaterial : 0
            }
            colorAddOn={colorAddOn}
          />
        </div>
      </div>

      <div className="flex flex-row-reverse items-center gap-2 border-t border-border/60 pt-4">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? he.common.saving
            : isEditing
              ? he.common.save
              : "שמירת טיפול"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          {he.common.cancel}
        </Button>
      </div>
    </form>
  );
}

interface ColorAddOnPanelProps {
  enabled: boolean;
  onToggle: (checked: boolean) => void;
  priceInputProps: React.ComponentProps<"input">;
  priceError?: string;
}

function ColorAddOnPanel({
  enabled,
  onToggle,
  priceInputProps,
  priceError,
}: ColorAddOnPanelProps) {
  return (
    <div className="rounded-lg border border-border/70 bg-secondary/30 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Palette className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">{he.addOns.sectionTitle}</span>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="flex flex-col gap-0.5">
          <Label
            htmlFor="has_color_addon"
            className="cursor-pointer text-sm font-medium"
          >
            {he.addOns.colorToggleLabel}
          </Label>
          <span className="text-xs text-muted-foreground">
            כשהאפשרות דלוקה, הסכום מתווסף ישירות למחיר הטיפול
          </span>
        </div>
        <div className="flex items-center gap-3">
          {enabled && (
            <div className="w-32">
              <Input
                id="color_addon_price"
                type="number"
                inputMode="decimal"
                step="1"
                min={0}
                suffix="₪"
                aria-label={he.addOns.colorPriceLabel}
                {...priceInputProps}
              />
            </div>
          )}
          <Switch
            id="has_color_addon"
            checked={enabled}
            onCheckedChange={onToggle}
          />
        </div>
      </div>
      {enabled && priceError && (
        <span className="mt-2 block text-xs text-destructive" role="alert">
          {priceError}
        </span>
      )}
    </div>
  );
}

interface FormFieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}

function FormField({ label, htmlFor, error, children }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
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
