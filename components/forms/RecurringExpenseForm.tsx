"use client";

import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useLiveQuery } from "dexie-react-hooks";
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
import {
  recurringExpenseFormSchema,
  type RecurringExpenseFormValues,
  RECURRING_FORM_DEFAULTS,
  PAYMENT_METHODS,
} from "@/lib/schemas/recurring-form";
import {
  createRecurringExpense,
  updateRecurringExpense,
} from "@/lib/db/recurring";
import { readExpenseCategories } from "@/lib/db/settings";
import type { RecurringExpense } from "@/lib/db/schema";
import { he } from "@/lib/i18n/he";
import { cn } from "@/lib/utils";

interface RecurringExpenseFormProps {
  initial?: RecurringExpense;
  onSaved: () => void;
  onCancel: () => void;
}

function initialValues(
  initial?: RecurringExpense,
): RecurringExpenseFormValues {
  if (!initial) return RECURRING_FORM_DEFAULTS;
  return {
    name_he: initial.name_he,
    amount_ils: initial.amount_ils,
    expense_category: initial.expense_category,
    payment_method: initial.payment_method,
    day_of_month: initial.day_of_month,
    is_active: initial.is_active,
    notes_he: initial.notes_he,
  };
}

export function RecurringExpenseForm({
  initial,
  onSaved,
  onCancel,
}: RecurringExpenseFormProps) {
  const [isPending, startTransition] = useTransition();
  const isEditing = Boolean(initial);

  const categories = useLiveQuery(() => readExpenseCategories(), [], []);

  const form = useForm<RecurringExpenseFormValues>({
    resolver: zodResolver(recurringExpenseFormSchema),
    defaultValues: initialValues(initial),
    mode: "onBlur",
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = form;

  const watchedCategory = watch("expense_category");
  const watchedPayment = watch("payment_method");
  const watchedActive = watch("is_active");

  useEffect(() => {
    if (!initial) return;
    form.reset(initialValues(initial));
  }, [initial, form]);

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      try {
        const payload = {
          name_he: values.name_he.trim(),
          amount_ils: values.amount_ils,
          expense_category: values.expense_category,
          payment_method: values.payment_method,
          day_of_month: values.day_of_month,
          is_active: values.is_active,
          notes_he: values.notes_he?.trim() || null,
        };
        if (initial) {
          await updateRecurringExpense(initial.id, payload);
        } else {
          await createRecurringExpense(payload);
        }
        toast.success(he.recurring.saveSuccess);
        onSaved();
      } catch {
        toast.error(he.errors.generic);
      }
    });
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-1 flex-col gap-6">
      <div className="flex flex-1 flex-col gap-5">
        {/* Name */}
        <FormField
          label={he.recurring.fields.name}
          error={errors.name_he?.message}
          htmlFor="rec_name"
        >
          <Input
            id="rec_name"
            autoFocus
            type="text"
            placeholder={he.recurring.fields.namePlaceholder}
            {...register("name_he")}
          />
        </FormField>

        {/* Amount + Day */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <FormField
            label={he.recurring.fields.amount}
            error={errors.amount_ils?.message}
            htmlFor="rec_amount"
          >
            <Input
              id="rec_amount"
              type="number"
              inputMode="decimal"
              step="1"
              min={0}
              suffix="₪"
              placeholder="0"
              {...register("amount_ils", { valueAsNumber: true })}
            />
          </FormField>

          <FormField
            label={he.recurring.fields.dayOfMonth}
            error={errors.day_of_month?.message}
            htmlFor="rec_day"
            help={he.recurring.fields.dayOfMonthHelp}
          >
            <Input
              id="rec_day"
              type="number"
              inputMode="numeric"
              step="1"
              min={1}
              max={28}
              {...register("day_of_month", { valueAsNumber: true })}
            />
          </FormField>
        </div>

        {/* Category */}
        <FormField
          label={he.recurring.fields.category}
          error={errors.expense_category?.message}
          htmlFor="rec_category"
        >
          <Select
            dir="rtl"
            value={watchedCategory || undefined}
            onValueChange={(v) =>
              setValue("expense_category", v, { shouldValidate: true })
            }
          >
            <SelectTrigger id="rec_category">
              <SelectValue placeholder={he.transactions.fields.expenseCategoryPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              {(categories ?? []).map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        {/* Payment method */}
        <FormField
          label={he.recurring.fields.paymentMethod}
          error={errors.payment_method?.message}
          htmlFor="rec_payment"
        >
          <Select
            dir="rtl"
            value={watchedPayment}
            onValueChange={(v) =>
              setValue(
                "payment_method",
                v as RecurringExpenseFormValues["payment_method"],
                { shouldValidate: true },
              )
            }
          >
            <SelectTrigger id="rec_payment">
              <SelectValue
                placeholder={he.transactions.fields.paymentMethodPlaceholder}
              />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_METHODS.map((m) => (
                <SelectItem key={m} value={m}>
                  {he.paymentMethods[m]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        {/* Notes */}
        <FormField
          label={he.recurring.fields.notes}
          htmlFor="rec_notes"
        >
          <Input
            id="rec_notes"
            type="text"
            placeholder={he.recurring.fields.notesPlaceholder}
            {...register("notes_he", {
              setValueAs: (v) => (v === "" ? null : v),
            })}
          />
        </FormField>

        {/* Active toggle */}
        <div className="flex items-center justify-between rounded-lg border border-border/70 bg-secondary/30 p-4">
          <Label htmlFor="rec_active" className="cursor-pointer">
            {he.recurring.fields.status}
          </Label>
          <Switch
            id="rec_active"
            checked={watchedActive}
            onCheckedChange={(checked) =>
              setValue("is_active", checked, { shouldValidate: false })
            }
          />
        </div>
      </div>

      <div className="flex flex-row-reverse items-center gap-2 border-t border-border/60 pt-4">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? he.common.saving
            : isEditing
              ? he.common.save
              : he.common.add}
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
